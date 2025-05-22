import axios from 'axios';
import { supabase } from '../lib/supabase';
import { ATSService } from './ats.service';

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
  private atsService: ATSService;
  
  constructor() {
    this.atsService = new ATSService();
  }

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

  // Store job description using ATSService
  async storeJobDescription(description: string, folderId: string, userId: string): Promise<string | null> {
    try {
      console.log(`Storing job description: description length=${description.length}, folderId=${folderId}, userId=${userId}`);
      return await this.atsService.storeJobDescription(description, folderId, userId);
    } catch (error) {
      console.error('Exception in storeJobDescription:', error);
      return null;
    }
  }
  
  // Store analysis result using ATSService
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
      console.log(`Storing analysis result: fileId=${fileId}, jobDescriptionId=${jobDescriptionId}, matchScore=${matchScore}, userId=${userId}`);
      return await this.atsService.storeAnalysisResult(
        fileId,
        jobDescriptionId,
        matchScore,
        strengths,
        weaknesses,
        achievementBonus,
        aspectScores,
        userId
      );
    } catch (error) {
      console.error('Exception in storeAnalysisResult:', error);
      return null;
    }
  }
  
  // Get latest job description for a folder using ATSService
  async getLatestJobDescription(folderId: string, userId: string): Promise<{ id: string, description: string } | null> {
    try {
      const jobDescription = await this.atsService.getJobDescription(folderId, userId);
      
      if (!jobDescription) {
        return null;
      }
      
      return {
        id: jobDescription.id,
        description: jobDescription.description
      };
    } catch (error) {
      console.error('Error in getLatestJobDescription:', error);
      return null;
    }
  }
  
  // Get analysis results for files in a folder
  async getFolderAnalysisResults(folderId: string, userId: string): Promise<AnalysisResult[]> {
    try {
      const results = await this.atsService.getAnalysisResultsForFolder(folderId, userId);
      
      // Transform the data to match our AnalysisResult interface
      return results.map(item => {
        // Get filename from the file_id if needed
        const filename = item.file_id ? item.file_id.toString() : 'Unknown';
        
        return {
          id: item.id,
          file_id: item.file_id,
          filename,
          score: item.match_score,
          matchedKeywords: Array.isArray(item.strengths) ? item.strengths : [],
          missingKeywords: Array.isArray(item.weaknesses) ? item.weaknesses : [],
          recommendations: [],
          analyzed_at: item.created_at
        };
      });
    } catch (error) {
      console.error('Error in getFolderAnalysisResults:', error);
      return [];
    }
  }
  
  // Check if a file has been analyzed
  async isFileAnalyzed(fileId: string, userId: string): Promise<boolean> {
    try {
      const { error, count } = await supabase
        .from('analysis_results')
        .select('id', { count: 'exact' })
        .eq('file_id', fileId)
        .eq('userId', userId)
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
      // Get current user ID
      let userId = 'temp_user_id';
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          userId = user.id;
        }
      } catch (authError) {
        console.error('Auth error:', authError);
      }
      
      const { data, error } = await supabase
        .from('files_with_analysis')
        .select('file_id')
        .eq('folder_id', folderId)
        .eq('user_id', userId)
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