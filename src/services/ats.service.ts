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
        .eq('userId', userId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching analysis result before deletion:', fetchError);
        return { success: false };
      }
      
      const fileId = analysisData?.file_id;
      
      // Now delete the analysis result
      const { error } = await supabase
        .from('analysis_results')
        .delete()
        .eq('id', analysisId)
        .eq('userId', userId);
      
      if (error) throw error;
      
      return { success: true, fileId };
    } catch (error) {
      console.error('Error deleting analysis result:', error);
      return { success: false };
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
      // Check if the file has any analysis results
      const { count, error } = await supabase
        .from('analysis_results')
        .select('id', { count: 'exact', head: true })
        .eq('file_id', fileId)
        .eq('userId', userId);
      
      if (error) {
        console.error('Error checking file analysis status:', error);
        return;
      }
      
      // Log the status for debugging
      console.log(`File ${fileId} has ${count || 0} analysis results`);
      
      // Optionally, you could update a flag in the files table to indicate if the file has been analyzed
      // This would be useful if the files_with_analysis view isn't updating properly
      
      // Dispatch an event to update the UI
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('fileAnalysisStatusChanged', {
          detail: {
            fileId,
            isAnalyzed: count !== null && count > 0
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error refreshing file analysis status:', error);
    }
  }
} 