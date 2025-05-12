import { supabase } from '../lib/supabase';

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
      
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
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
} 