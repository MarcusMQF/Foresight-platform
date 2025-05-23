import { supabase } from '../lib/supabase';

export interface JobDescription {
  id: string;
  description: string;
  folder_id: string;
  created_at: string;
  updated_at: string;
  userId: string;
}

export interface AnalysisResult {
  id: string;
  file_id: string;
  job_description_id: string;
  match_score: number;
  strengths: string[];
  weaknesses: string[];
  achievement_bonus: number;
  aspect_scores: Record<string, number>;
  created_at: string;
  updated_at: string;
  userId: string;
}

export class ATSService {
  /**
   * Get the latest job description for a folder
   */
  async getJobDescription(folderId: string, userId: string): Promise<JobDescription | null> {
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('folder_id', folderId)
        .eq('userId', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting job description:', error);
      return null;
    }
  }

  /**
   * Store or update a job description for a folder
   */
  async storeJobDescription(
    description: string,
    folderId: string,
    userId: string
  ): Promise<string | null> {
    try {
      // Check if a job description already exists for this folder
      const existingJobDescription = await this.getJobDescription(folderId, userId);
      
      if (existingJobDescription) {
        // Update existing job description
        const { data, error } = await supabase
          .from('job_descriptions')
          .update({
            description,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingJobDescription.id)
          .select('id')
          .single();
        
        if (error) throw error;
        return data.id;
      } else {
        // Create new job description
        const { data, error } = await supabase
          .from('job_descriptions')
          .insert({
            description,
            folder_id: folderId,
            userId
          })
          .select('id')
          .single();
        
        if (error) throw error;
        return data.id;
      }
    } catch (error) {
      console.error('Error storing job description:', error);
      return null;
    }
  }

  /**
   * Store analysis results for a file
   */
  async storeAnalysisResult(
    fileId: string,
    jobDescriptionId: string,
    matchScore: number,
    strengths: string[],
    weaknesses: string[],
    achievementBonus: number,
    aspectScores: Record<string, number>,
    userId: string
  ): Promise<string | null> {
    try {
      // Check if analysis already exists for this file
      const { data: existingAnalysis, error: checkError } = await supabase
        .from('analysis_results')
        .select('id')
        .eq('file_id', fileId)
        .eq('userId', userId)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingAnalysis) {
        // Update existing analysis
        const { data, error } = await supabase
          .from('analysis_results')
          .update({
            job_description_id: jobDescriptionId,
            match_score: matchScore,
            strengths,
            weaknesses,
            achievement_bonus: achievementBonus,
            aspect_scores: aspectScores,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAnalysis.id)
          .select('id')
          .single();
        
        if (error) throw error;
        return data.id;
      } else {
        // Create new analysis
        const { data, error } = await supabase
          .from('analysis_results')
          .insert({
            file_id: fileId,
            job_description_id: jobDescriptionId,
            match_score: matchScore,
            strengths,
            weaknesses,
            achievement_bonus: achievementBonus,
            aspect_scores: aspectScores,
            userId
          })
          .select('id')
          .single();
        
        if (error) throw error;
        return data.id;
      }
    } catch (error) {
      console.error('Error storing analysis result:', error);
      return null;
    }
  }

  /**
   * Get all analysis results for a folder
   */
  async getAnalysisResultsForFolder(folderId: string, userId: string): Promise<AnalysisResult[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_folder_analysis_results', {
          p_folder_id: folderId,
          p_user_id: userId
        });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting analysis results for folder:', error);
      return [];
    }
  }

  /**
   * Delete an analysis result
   * @returns Object with success status and file_id of the deleted result
   */
  async deleteAnalysisResult(analysisId: string, userId: string): Promise<{success: boolean, fileId?: string}> {
    try {
      // First get the file_id for the analysis result before deleting it
      const { data: analysisData, error: fetchError } = await supabase
        .from('analysis_results')
        .select('file_id')
        .eq('id', analysisId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching analysis result before deletion:', fetchError);
        return { success: false };
      }
      
      const fileId = analysisData?.file_id;

      if (!fileId) {
        console.error('No file_id found for analysis result');
        return { success: false };
      }
      
      // Use the delete_analysis_by_id function
      const { data, error } = await supabase
        .rpc('delete_analysis_by_id', {
          p_analysis_id: analysisId
        });
      
      if (error) {
        console.error('Error using delete_analysis_by_id:', error);
        
        // Fallback to direct delete if RPC fails
        const { error: deleteError } = await supabase
          .from('analysis_results')
          .delete()
          .eq('id', analysisId);
        
        if (deleteError) {
          console.error('Error with fallback delete:', deleteError);
          return { success: false };
        }
      }
      
      // After delete, force a refresh of the analysis status
      await this.refreshFileAnalysisStatus(fileId, userId);
      
      return { success: true, fileId };
    } catch (error) {
      console.error('Error deleting analysis result:', error);
      return { success: false };
    }
  }

  /**
   * Delete all analysis results for a file
   */
  async deleteFileAnalysis(fileId: string, userId: string): Promise<boolean> {
    try {
      // Use the delete_file_analysis function
      const { data, error } = await supabase
        .rpc('delete_file_analysis', {
          p_file_id: fileId
        });
      
      if (error) {
        console.error('Error using delete_file_analysis:', error);
        
        // Fallback to direct delete if RPC fails
        const { error: deleteError } = await supabase
          .from('analysis_results')
          .delete()
          .eq('file_id', fileId);
        
        if (deleteError) {
          console.error('Error with fallback delete:', deleteError);
          return false;
        }
      }
      
      // After delete, force a refresh of the analysis status
      await this.refreshFileAnalysisStatus(fileId, userId);
      
      return true;
    } catch (error) {
      console.error('Error deleting all analysis for file:', error);
      return false;
    }
  }

  /**
   * Check if a file has been analyzed
   */
  async isFileAnalyzed(fileId: string, userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('analysis_results')
        .select('id', { count: 'exact', head: true })
        .eq('file_id', fileId)
        .eq('userId', userId);
      
      if (error) throw error;
      return count !== null && count > 0;
    } catch (error) {
      console.error('Error checking if file is analyzed:', error);
      return false;
    }
  }
  
  /**
   * Get analysis results for a specific file
   */
  async getAnalysisResultsForFile(fileId: string, userId: string): Promise<AnalysisResult[]> {
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('file_id', fileId)
        .eq('userId', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting analysis results for file:', error);
      return [];
    }
  }

  /**
   * Force refresh the analysis status of a file
   * This will ensure the files_with_analysis view is updated
   */
  async refreshFileAnalysisStatus(fileId: string, userId: string): Promise<void> {
    try {
      console.log(`Refreshing analysis status for file ID: ${fileId}`);
      
      // Check if the file has any analysis results
      const { count, error } = await supabase
        .from('analysis_results')
        .select('id', { count: 'exact', head: true })
        .eq('file_id', fileId);
      
      if (error) {
        console.error('Error checking file analysis status:', error);
        return;
      }
      
      const isAnalyzed = count !== null && count > 0;
      console.log(`File ${fileId} has ${count || 0} analysis results, isAnalyzed=${isAnalyzed}`);

      // Get folder ID for this file to manage folder-specific analysis flags
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('folderId')
        .eq('id', fileId)
        .single();
        
      if (fileError) {
        console.error('Error getting file folder ID:', fileError);
      } else if (fileData?.folderId) {
        const folderId = fileData.folderId;
        
        // Update the folder-specific analyzed files list in localStorage
        try {
          const folderAnalyzedFilesKey = `analyzed_files_${folderId}`;
          let folderAnalyzedFiles: string[] = [];
          
          try {
            const existingData = localStorage.getItem(folderAnalyzedFilesKey);
            if (existingData) {
              folderAnalyzedFiles = JSON.parse(existingData);
            }
          } catch (parseError) {
            console.error(`Error parsing ${folderAnalyzedFilesKey}:`, parseError);
          }
          
          if (isAnalyzed && !folderAnalyzedFiles.includes(fileId)) {
            // Add the file ID if it's now analyzed
            folderAnalyzedFiles.push(fileId);
          } else if (!isAnalyzed) {
            // Remove the file ID if it's no longer analyzed
            folderAnalyzedFiles = folderAnalyzedFiles.filter(id => id !== fileId);
          }
          
          localStorage.setItem(folderAnalyzedFilesKey, JSON.stringify(folderAnalyzedFiles));
          console.log(`Updated folder-specific localStorage for folder ${folderId}, file ${fileId}: ${isAnalyzed}`);
        } catch (localStorageError) {
          console.error('Error updating folder-specific localStorage:', localStorageError);
        }
      }
      
      // Dispatch an event to update the UI
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('fileAnalysisStatusChanged', {
          detail: {
            fileId,
            isAnalyzed
          }
        });
        window.dispatchEvent(event);
        console.log('Dispatched fileAnalysisStatusChanged event');
        
        // Also update a flag in localStorage to ensure UI consistency
        try {
          const analyzedFilesKey = `analyzedFiles_${userId}`;
          const analyzedFilesJson = localStorage.getItem(analyzedFilesKey) || '{}';
          const analyzedFiles = JSON.parse(analyzedFilesJson);
          
          if (isAnalyzed) {
            analyzedFiles[fileId] = true;
          } else {
            delete analyzedFiles[fileId];
          }
          
          localStorage.setItem(analyzedFilesKey, JSON.stringify(analyzedFiles));
          console.log(`Updated localStorage analyzed status for file ${fileId}: ${isAnalyzed}`);
        } catch (e) {
          console.error('Error updating localStorage analyzed files:', e);
        }
      }
    } catch (error) {
      console.error('Error refreshing file analysis status:', error);
    }
  }

  /**
   * Check if a folder has any analysis results
   */
  async folderHasAnalysisResults(folderId: string, userId: string): Promise<boolean> {
    try {
      // Get all files in the folder
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('id')
        .eq('folderId', folderId);
      
      if (filesError) throw filesError;
      if (!files || files.length === 0) return false;
      
      // Check if any of these files have analysis results
      const fileIds = files.map(file => file.id);
      const { count, error: countError } = await supabase
        .from('analysis_results')
        .select('id', { count: 'exact', head: true })
        .in('file_id', fileIds)
        .eq('userId', userId);
      
      if (countError) throw countError;
      return count !== null && count > 0;
    } catch (error) {
      console.error('Error checking if folder has analysis results:', error);
      return false;
    }
  }
} 