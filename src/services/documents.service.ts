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
      const isZipFile = file.type === 'application/zip' || 
                      file.type === 'application/x-zip-compressed' ||
                      file.name.toLowerCase().endsWith('.zip');
      
      if (isZipFile) {
        // Reject ZIP files as we're only allowing PDFs
        throw new Error('ZIP files are not supported. Please upload PDF files only.');
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
        const validExtensions = ['pdf'];
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
      'pdf': 'application/pdf'
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
   * Delete a file with all parameters
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
   * Delete a file by ID only - fetches folder and user info from database
   */
  async deleteFileById(fileId: string): Promise<void> {
    try {
      // First get the file details to get folderId and userId
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('folderId, userId')
        .eq('id', fileId)
        .single();
      
      if (fileError) {
        throw fileError;
      }
      
      if (!fileData) {
        throw new Error(`File not found with ID: ${fileId}`);
      }
      
      const { folderId, userId } = fileData;
      
      // Now delete the file with all required params
      await this.deleteFile(fileId, folderId, userId);
    } catch (error) {
      console.error('Error deleting file by ID:', error);
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
   * @param filePath The path to the file in storage
   * @param forceDownload Whether to force download (vs. view) the file
   */
  async getFileUrl(filePath: string, forceDownload: boolean = false): Promise<string> {
    try {
      // Add download=false to ensure the file is viewed instead of downloaded (unless requested)
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 60 * 60, {
          download: forceDownload,
          transform: {
            width: 0, // Setting width to 0 means don't resize
            height: 0, // Setting height to 0 means don't resize
            quality: 100 // Keep original quality
          }
        }); 
      
      if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
      }
      
      if (!data || !data.signedUrl) {
        console.error('No signed URL returned');
        throw new Error('Failed to get file URL');
      }
      
      console.log('Successfully generated signed URL for file:', filePath);
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  /**
   * Get a file as a Blob to display in the browser
   * This is especially useful for PDFs that need to be displayed in the UI
   * @param filePath The path to the file in storage
   * @returns A blob URL for the file
   */
  async getFileAsBlob(filePath: string): Promise<string> {
    try {
      // Get the signed URL first
      const signedUrl = await this.getFileUrl(filePath, false);
      
      // Fetch the file as a blob
      console.log('Fetching file as blob from signed URL:', signedUrl);
      const response = await fetch(signedUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Accept': 'application/pdf, application/octet-stream, */*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      // Get the blob
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Received empty file');
      }
      
      // Create a blob URL to display in the browser
      let contentType = blob.type;
      
      // If the server didn't provide a content type or it's octet-stream,
      // try to determine it from the file extension
      if (!contentType || contentType === 'application/octet-stream') {
        if (filePath.toLowerCase().endsWith('.pdf')) {
          contentType = 'application/pdf';
        } else if (filePath.toLowerCase().match(/\.(jpe?g)$/i)) {
          contentType = 'image/jpeg';
        } else if (filePath.toLowerCase().endsWith('.png')) {
          contentType = 'image/png';
        }
      }
      
      // Create a new blob with the correct content type
      const fileBlob = new Blob([blob], { type: contentType || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(fileBlob);
      
      console.log('Created blob URL for file:', blobUrl);
      
      return blobUrl;
    } catch (error) {
      console.error('Error getting file as blob:', error);
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

  /**
   * Get a direct download URL for a file
   * @param filePath The path to the file in storage
   * @returns A URL that will trigger file download
   */
  async getDownloadUrl(filePath: string): Promise<string> {
    // Force download=true to ensure the file is downloaded instead of viewed
    return this.getFileUrl(filePath, true);
  }

  /**
   * Fetches a file as a blob URL with retry mechanism
   * @param fileUrl The Supabase storage URL of the file
   * @param maxRetries Maximum number of retry attempts
   * @param retryDelay Delay between retries in milliseconds
   * @returns A Promise that resolves to a blob URL
   */
  async getFileAsBlobWithRetry(
    fileUrl: string, 
    maxRetries: number = 3, 
    retryDelay: number = 1500
  ): Promise<string> {
    let attempts = 0;
    
    const attempt = async (): Promise<string> => {
      try {
        attempts++;
        console.log(`Attempt ${attempts}/${maxRetries + 1} to fetch file: ${fileUrl}`);
        
        // Use the existing method
        const blobUrl = await this.getFileAsBlob(fileUrl);
        console.log(`Successfully fetched file on attempt ${attempts}`);
        return blobUrl;
      } catch (error) {
        console.error(`Error on attempt ${attempts}:`, error);
        
        if (attempts <= maxRetries) {
          console.log(`Retrying in ${retryDelay}ms...`);
          // Wait for the delay
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          // Exponential backoff for retry delay
          retryDelay = Math.min(retryDelay * 1.5, 10000);
          // Try again
          return attempt();
        } else {
          console.error(`Failed after ${attempts} attempts`);
          throw error;
        }
      }
    };
    
    return attempt();
  }
} 