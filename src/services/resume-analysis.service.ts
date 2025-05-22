import axios from 'axios';
import { supabase } from '../lib/supabase';

export interface AnalysisResult {
  id?: string;
  file_id?: string;
  filename: string;
  fileUrl?: string;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
  analyzed_at?: string;
}

export interface AspectWeights {
  skills: number;
  experience: number;
  achievements: number;
  education: number;
  culturalFit: number;
}

export class ResumeAnalysisService {
  private apiUrl = 'http://localhost:8000/api';

  async analyzeResume(file: File, jobDescription: string): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescription);
    
    try {
      const response = await axios.post(`${this.apiUrl}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing resume:', error);
      throw error;
    }
  }
  
  async analyzeFolderContent(files: File[], jobDescription: string): Promise<AnalysisResult[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('resumes', file);
    });
    formData.append('job_description', jobDescription);
    
    try {
      const response = await axios.post(`${this.apiUrl}/analyze-batch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.results;
    } catch (error) {
      console.error('Error analyzing multiple resumes:', error);
      throw error;
    }
  }

  // Store job description with fallback method if RPC fails
  async storeJobDescription(description: string, folderId: string, userId: string): Promise<string | null> {
    try {
      console.log(`Calling store_job_description with: description length=${description.length}, folderId=${folderId}, userId=${userId}`);
      
      // First try the RPC method
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'store_job_description',
        {
          p_description: description,
          p_folder_id: folderId,
          p_user_id: userId
        }
      );
      
      if (!rpcError) {
        console.log('Job description stored via RPC, received data:', rpcData);
        return rpcData; // Returns the job description ID
      }
      
      console.error('Supabase RPC error storing job description:', rpcError);
      
      // Fallback: Try direct insert
      console.log('Attempting fallback method for storing job description');
      
      const { data: insertData, error: insertError } = await supabase
        .from('job_descriptions')
        .insert({
          description: description,
          folder_id: folderId,
          userId: userId
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Fallback insert also failed:', insertError);
        return null;
      }
      
      console.log('Job description stored via fallback method:', insertData);
      return insertData.id;
    } catch (error) {
      console.error('Exception in storeJobDescription:', error);
      return null;
    }
  }
  
  // Store analysis result with fallback method if RPC fails
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
      console.log(`Calling store_analysis_result with: fileId=${fileId}, jobDescriptionId=${jobDescriptionId}, matchScore=${matchScore}, userId=${userId}`);
      
      // Convert arrays to JSON strings for storage
      const strengthsJson = JSON.stringify(strengths);
      const weaknessesJson = JSON.stringify(weaknesses);
      const aspectScoresJson = JSON.stringify(aspectScores);
      
      // First try the RPC method
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'store_analysis_result',
        {
          p_file_id: fileId,
          p_job_description_id: jobDescriptionId,
          p_match_score: matchScore,
          p_strengths: strengthsJson,
          p_weaknesses: weaknessesJson,
          p_achievement_bonus: achievementBonus,
          p_aspect_scores: aspectScoresJson,
          p_user_id: userId
        }
      );
      
      if (!rpcError) {
        console.log('Analysis result stored via RPC, received data:', rpcData);
        return rpcData; // Returns the analysis result ID
      }
      
      console.error('Supabase RPC error storing analysis result:', rpcError);
      if (rpcError.message) {
        console.error('Error message:', rpcError.message);
      }
      if (rpcError.details) {
        console.error('Error details:', rpcError.details);
      }
      if (rpcError.hint) {
        console.error('Error hint:', rpcError.hint);
      }
      
      // Fallback: Try direct insert
      console.log('Attempting fallback method for storing analysis result');
      
      const { data: insertData, error: insertError } = await supabase
        .from('analysis_results')
        .insert({
          file_id: fileId,
          job_description_id: jobDescriptionId,
          match_score: matchScore,
          strengths: strengthsJson,
          weaknesses: weaknessesJson,
          achievement_bonus: achievementBonus,
          aspect_scores: aspectScoresJson,
          userId: userId
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Fallback insert also failed:', insertError);
        return null;
      }
      
      console.log('Analysis result stored via fallback method:', insertData);
      return insertData.id;
    } catch (error) {
      console.error('Exception in storeAnalysisResult:', error);
      return null;
    }
  }
  
  // Get latest job description for a folder
  async getLatestJobDescription(folderId: string, userId: string): Promise<{ id: string, description: string } | null> {
    try {
      const { data, error } = await supabase.rpc(
        'get_latest_job_description',
        {
          p_folder_id: folderId,
          p_user_id: userId
        }
      );
      
      if (error || !data || data.length === 0) {
        console.error('Error getting job description:', error);
        return null;
      }
      
      return {
        id: data[0].id,
        description: data[0].description
      };
    } catch (error) {
      console.error('Error in getLatestJobDescription:', error);
      return null;
    }
  }
  
  // Get analysis results for files in a folder
  async getFolderAnalysisResults(folderId: string): Promise<AnalysisResult[]> {
    try {
      const { data, error } = await supabase.rpc(
        'get_folder_analysis_results',
        {
          p_folder_id: folderId
        }
      );
      
      if (error) {
        console.error('Error getting folder analysis results:', error);
        return [];
      }
      
      // Define an interface for the data returned from the database
      interface DbAnalysisResult {
        file_id: string;
        file_name: string;
        match_score: number;
        strengths: string;
        weaknesses: string;
        analyzed_at: string;
      }
      
      // Transform the data to match our AnalysisResult interface
      return (data as DbAnalysisResult[])
        .filter((item: DbAnalysisResult) => item && item.match_score !== null)
        .map((item: DbAnalysisResult) => ({
          id: item.file_id,
          file_id: item.file_id,
          filename: item.file_name,
          score: item.match_score,
          matchedKeywords: item.strengths ? JSON.parse(item.strengths) : [],
          missingKeywords: item.weaknesses ? JSON.parse(item.weaknesses) : [],
          recommendations: [],
          analyzed_at: item.analyzed_at
        }));
    } catch (error) {
      console.error('Error in getFolderAnalysisResults:', error);
      return [];
    }
  }
  
  // Check if a file has been analyzed
  async isFileAnalyzed(fileId: string): Promise<boolean> {
    try {
      const { error, count } = await supabase
        .from('analysis_results')
        .select('id', { count: 'exact' })
        .eq('file_id', fileId)
        .limit(1);
      
      if (error) {
        console.error('Error checking if file is analyzed:', error);
        return false;
      }
      
      return count !== null && count > 0;
    } catch (error) {
      console.error('Error in isFileAnalyzed:', error);
      return false;
    }
  }
  
  // Get all analyzed files in a folder
  async getAnalyzedFilesInFolder(folderId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('files_with_analysis')
        .select('file_id')
        .eq('folder_id', folderId)
        .not('analysis_id', 'is', null);
      
      if (error) {
        console.error('Error getting analyzed files:', error);
        return [];
      }
      
      interface AnalyzedFileResult {
        file_id: string;
      }
      
      return (data as AnalyzedFileResult[])
        .filter((item: AnalyzedFileResult) => item && item.file_id)
        .map((item: AnalyzedFileResult) => item.file_id);
    } catch (error) {
      console.error('Error in getAnalyzedFilesInFolder:', error);
      return [];
    }
  }
}

export default new ResumeAnalysisService(); 