import { supabase } from '../lib/supabase';
import { FileValidationService } from './file-validation.service';
import JSZip from 'jszip';

// Types for document management
export interface FolderItem {
  id: string;
  name: string;
  date: string;
  files: number;
  userId: string;
}

export interface FileItem {
  id: string;
  name: string;
  folderId: string;
  size: number;
  type: string;
  url: string;
  date: string;
  userId: string;
}

export class DocumentsService {
  private BUCKET_NAME = 'documents';
  private fileValidationService: FileValidationService;

  constructor() {
    this.fileValidationService = new FileValidationService();
  }

  /**
   * Create a new folder in Supabase database
   */
  async createFolder(folderName: string, userId: string): Promise<FolderItem> {
    try {
      const newFolder: Omit<FolderItem, 'id'> = {
        name: folderName,
        date: new Date().toISOString(),
        files: 0,
        userId
      };
      
      const { data, error } = await supabase
        .from('folders')
        .insert(newFolder)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  /**
   * Get all folders for a specific user
   */
  async getFolders(userId: string): Promise<FolderItem[]> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('userId', userId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting folders:', error);
      throw error;
    }
  }

  /**
   * Rename a folder
   */
  async renameFolder(folderId: string, newName: string): Promise<FolderItem> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error renaming folder:', error);
      throw error;
    }
  }

  /**
   * Delete a folder and all its files
   */
  async deleteFolder(folderId: string, userId: string): Promise<void> {
    try {
      // First get all files in the folder to delete from storage
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('folderId', folderId);

      // Delete files from storage
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${folderId}/${file.id}`);
        const { error: storageError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filePaths);
        
        if (storageError) throw storageError;
      }

      // Delete file records from database
      const { error: filesDbError } = await supabase
        .from('files')
        .delete()
        .eq('folderId', folderId);
      
      if (filesDbError) throw filesDbError;

      // Delete folder from database
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  /**
   * Upload a file to a specific folder
   */
  async uploadFile(
    file: File, 
    folderId: string, 
    userId: string
  ): Promise<FileItem> {
    try {
      // Check if it's a zip file
      const isZipFile = file.type === 'application/zip' || 
                      file.type === 'application/x-zip-compressed' ||
                      file.name.toLowerCase().endsWith('.zip');
      
      if (isZipFile) {
        // Handle zip file differently - extract and upload contents
        return await this.handleZipFileUpload(file, folderId, userId);
      }

      // Validate file type and size
      const validationResult = this.fileValidationService.validateFile(file);
      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }
      
      // Check for duplicate file name
      const duplicateNameResult = await this.fileValidationService.checkForDuplicateFileName(file.name, folderId);
      if (!duplicateNameResult.valid) {
        throw new Error(duplicateNameResult.error);
      }
      
      // Check for similar content
      const similarContentResult = await this.fileValidationService.checkForSimilarContent(file, folderId);
      if (!similarContentResult.valid) {
        throw new Error(similarContentResult.error);
      }
      
      // Generate unique file ID
      const fileId = crypto.randomUUID();
      const fileName = `${userId}/${folderId}/${fileId}`;
      
      // Upload file to storage with better error handling
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Changed to true to allow overwriting
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error('No upload path returned from storage');
      }

      // Create file record in database
      const fileRecord: Omit<FileItem, 'id'> = {
        name: file.name,
        folderId,
        size: file.size,
        type: file.type,
        url: uploadData.path,
        date: new Date().toISOString(),
        userId
      };

      const { data, error } = await supabase
        .from('files')
        .insert(fileRecord)
        .select()
        .single();

      if (error) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage
          .from('documents')
          .remove([fileName])
          .catch(err => console.error('Failed to clean up uploaded file:', err));
          
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from database insert');
      }

      // Update folder files count
      await this.incrementFolderFileCount(folderId);
      
      // Ensure the folder file count is accurate
      await this.syncFolderFileCount(folderId);
      
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Handle zip file upload by extracting contents and uploading individual files
   */
  private async handleZipFileUpload(
    zipFile: File,
    folderId: string,
    userId: string
  ): Promise<FileItem> {
    try {
      // First upload the zip file itself
      const zipFileId = crypto.randomUUID();
      const zipFileName = `${userId}/${folderId}/${zipFileId}`;
      
      const { data: zipUploadData, error: zipUploadError } = await supabase.storage
        .from('documents')
        .upload(zipFileName, zipFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (zipUploadError) {
        throw new Error(`Failed to upload zip file: ${zipUploadError.message}`);
      }

      if (!zipUploadData?.path) {
        throw new Error('No upload path returned from storage');
      }

      // Create zip file record in database
      const zipFileRecord: Omit<FileItem, 'id'> = {
        name: zipFile.name,
        folderId,
        size: zipFile.size,
        type: zipFile.type,
        url: zipUploadData.path,
        date: new Date().toISOString(),
        userId
      };

      const { data: zipFileData, error: zipFileInsertError } = await supabase
        .from('files')
        .insert(zipFileRecord)
        .select()
        .single();

      if (zipFileInsertError) {
        throw zipFileInsertError;
      }

      // Update folder files count for the zip file
      await this.incrementFolderFileCount(folderId);

      // Now extract and upload the contents
      const zip = new JSZip();
      const contents = await zip.loadAsync(zipFile);
      
      // Process each file in the zip
      const uploadPromises: Promise<void>[] = [];
      
      contents.forEach((relativePath, zipEntry) => {
        // Skip directories
        if (zipEntry.dir) return;
        
        // Skip hidden files
        if (relativePath.startsWith('.') || relativePath.includes('/._')) return;
        
        // Only process files with supported extensions
        const extension = relativePath.split('.').pop()?.toLowerCase();
        const validExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'];
        if (!extension || !validExtensions.includes(extension)) return;
        
        const extractPromise = async () => {
          try {
            // Get file data as blob
            const fileData = await zipEntry.async('blob');
            
            // Create a File object
            const extractedFile = new File(
              [fileData], 
              relativePath.split('/').pop() || 'unknown', 
              { type: this.getMimeTypeFromExtension(extension) }
            );
            
            // Check for duplicate file name
            const duplicateNameResult = await this.fileValidationService.checkForDuplicateFileName(extractedFile.name, folderId);
            if (!duplicateNameResult.valid) {
              console.log(`Skipping duplicate file: ${extractedFile.name}`);
              return;
            }
            
            // Generate unique ID for this extracted file
            const extractedFileId = crypto.randomUUID();
            const extractedFileName = `${userId}/${folderId}/${extractedFileId}`;
            
            // Upload the extracted file
            const { data: extractedUploadData, error: extractedUploadError } = await supabase.storage
              .from('documents')
              .upload(extractedFileName, extractedFile, {
                cacheControl: '3600',
                upsert: true
              });
            
            if (extractedUploadError) {
              console.error(`Error uploading extracted file ${extractedFile.name}:`, extractedUploadError);
              return;
            }

            if (!extractedUploadData?.path) {
              console.error(`No path returned for extracted file ${extractedFile.name}`);
              return;
            }

            // Create record for the extracted file
            const extractedFileRecord: Omit<FileItem, 'id'> = {
              name: extractedFile.name,
              folderId,
              size: extractedFile.size,
              type: extractedFile.type,
              url: extractedUploadData.path,
              date: new Date().toISOString(),
              userId
            };

            // Insert record
            const { error: extractedInsertError } = await supabase
              .from('files')
              .insert(extractedFileRecord);
            
            if (extractedInsertError) {
              console.error(`Error inserting extracted file record for ${extractedFile.name}:`, extractedInsertError);
              return;
            }

            // Update folder files count for each extracted file
            await this.incrementFolderFileCount(folderId);
            
          } catch (err) {
            console.error(`Error processing zip entry ${relativePath}:`, err);
          }
        };
        
        uploadPromises.push(extractPromise());
      });
      
      // Wait for all extracted files to be processed
      await Promise.allSettled(uploadPromises);
      
      // Sync the folder file count to ensure it matches the actual number of files
      await this.syncFolderFileCount(folderId);
      
      // Return the original zip file data
      return zipFileData;
      
    } catch (error) {
      console.error('Error handling zip file upload:', error);
      throw error;
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: {[key: string]: string} = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Get all files in a specific folder
   */
  async getFiles(folderId: string): Promise<FileItem[]> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folderId', folderId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting files:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string, folderId: string, userId: string): Promise<void> {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([`${userId}/${folderId}/${fileId}`]);
      
      if (storageError) throw storageError;

      // Delete file record from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);
      
      if (error) throw error;

      // Update folder files count
      await this.decrementFolderFileCount(folderId);
      
      // Ensure the folder file count is accurate
      await this.syncFolderFileCount(folderId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Update folder file count when adding a file
   */
  private async incrementFolderFileCount(folderId: string): Promise<void> {
    try {
      await supabase.rpc('increment_folder_file_count', { folder_id: folderId });
    } catch (error) {
      console.error('Error updating folder file count:', error);
    }
  }

  /**
   * Update folder file count when deleting a file
   */
  private async decrementFolderFileCount(folderId: string): Promise<void> {
    try {
      await supabase.rpc('decrement_folder_file_count', { folder_id: folderId });
    } catch (error) {
      console.error('Error updating folder file count:', error);
    }
  }

  /**
   * Get a signed URL for a file
   */
  async getFileUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
      
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  /**
   * Synchronize folder file count with actual count from database
   */
  async syncFolderFileCount(folderId: string): Promise<void> {
    try {
      // Get count of files in the database
      const { count, error } = await supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('folderId', folderId);
      
      if (error) throw error;
      
      // Update folder record with actual count
      const { error: updateError } = await supabase
        .from('folders')
        .update({ files: count || 0 })
        .eq('id', folderId);
      
      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error synchronizing folder file count:', error);
    }
  }

  /**
   * Repair file counts for all folders or a specific folder
   * This is useful when the file count becomes inconsistent
   */
  async repairFolderFileCounts(folderId?: string): Promise<void> {
    try {
      if (folderId) {
        // Repair a specific folder
        await this.syncFolderFileCount(folderId);
      } else {
        // Get all folders
        const { data: folders, error } = await supabase
          .from('folders')
          .select('id');
        
        if (error) throw error;
        
        // Repair each folder
        const repairPromises = folders.map(folder => this.syncFolderFileCount(folder.id));
        await Promise.all(repairPromises);
      }
    } catch (error) {
      console.error('Error repairing folder file counts:', error);
      throw error;
    }
  }
} 