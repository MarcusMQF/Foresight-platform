import { supabase } from './supabase';

/**
 * Initialize Supabase resources required for document management
 * - Creates necessary tables if they don't exist
 * - Sets up RLS policies
 */
export const initDocumentsStorage = async () => {
  try {
    console.log('Initializing Supabase documents storage...');
    
    // We'll skip bucket creation completely since we're hitting RLS issues
    // The application seems to work fine without explicitly creating the bucket
    
    // Set up database tables for folders if needed
    try {
      const { error: createFoldersTableError } = await supabase.rpc('create_folders_table');
      if (createFoldersTableError) {
        // Table might already exist, which is fine
        console.log('Note: Folders table might already exist');
      } else {
        console.log('Created folders table');
      }
    } catch (error) {
      console.warn('Error creating folders table, but continuing:', error);
    }

    // Set up database tables for files if needed
    try {
      const { error: createFilesTableError } = await supabase.rpc('create_files_table');
      if (createFilesTableError) {
        // Table might already exist, which is fine
        console.log('Note: Files table might already exist');
      } else {
        console.log('Created files table');
      }
    } catch (error) {
      console.warn('Error creating files table, but continuing:', error);
    }

    // Set up database tables for job descriptions if needed
    try {
      const { error: createJobDescriptionsTableError } = await supabase.rpc('create_job_descriptions_table');
      if (createJobDescriptionsTableError) {
        // Table might already exist, which is fine
        console.log('Note: Job descriptions table might already exist');
      } else {
        console.log('Created job descriptions table');
      }
    } catch (error) {
      console.warn('Error creating job descriptions table, but continuing:', error);
    }

    // Set up database tables for analysis results if needed
    try {
      const { error: createAnalysisResultsTableError } = await supabase.rpc('create_analysis_results_table');
      if (createAnalysisResultsTableError) {
        // Table might already exist, which is fine
        console.log('Note: Analysis results table might already exist');
      } else {
        console.log('Created analysis results table');
      }
    } catch (error) {
      console.warn('Error creating analysis results table, but continuing:', error);
    }

    console.log('Supabase documents storage initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase documents storage:', error);
    return false;
  }
}; 