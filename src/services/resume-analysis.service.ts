import axios from 'axios';

export interface AnalysisResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
  filename: string;
  fileUrl?: string; // Optional file URL for PDF viewing
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
} 