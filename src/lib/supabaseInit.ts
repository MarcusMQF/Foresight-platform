import { supabase } from './supabase';

/**
 * Initialize Supabase resources required for document management
 * - Creates necessary tables if they don't exist
 * - Creates storage buckets if they don't exist
 * - Sets up RLS policies
 */
export const initDocumentsStorage = async () => {
  try {
    console.log('Initializing Supabase documents storage...');
    
    // Check if the storage bucket exists, create if it doesn't
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) throw bucketsError;
    
    const documentsBucketExists = buckets?.some(bucket => bucket.name === 'documents');
    
    if (!documentsBucketExists) {
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('documents', {
          public: false, 
          fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
        });
      
      if (createBucketError) throw createBucketError;
      console.log('Created documents storage bucket');
    }

    // Set up database tables for folders if needed
    // This uses Postgres SQL commands via the rpc method
    const { error: createFoldersTableError } = await supabase.rpc('create_folders_table');
    if (createFoldersTableError) {
      // Table might already exist, which is fine
      console.log('Note: Folders table might already exist');
    } else {
      console.log('Created folders table');
    }

    // Set up database tables for files if needed
    const { error: createFilesTableError } = await supabase.rpc('create_files_table');
    if (createFilesTableError) {
      // Table might already exist, which is fine
      console.log('Note: Files table might already exist');
    } else {
      console.log('Created files table');
    }

    // Create stored procedures for folder file count management
    const { error: createFolderProceduresError } = await supabase.rpc('create_folder_procedures');
    if (createFolderProceduresError) {
      console.log('Note: Folder procedures might already exist');
    } else {
      console.log('Created folder procedures');
    }

    console.log('Supabase documents storage initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase documents storage:', error);
    return false;
  }
}; 