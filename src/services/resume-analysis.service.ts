import axios from 'axios';
import { supabase } from '../lib/supabase';
import { ATSService } from './ats.service';

// Define an interface for file objects with ID
interface FileWithId extends File {
  id?: string;
}

export interface AnalysisResult {
  id?: string;
  file_id?: string;
  folder_id?: string;
  filename: string;
  fileUrl?: string;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
  analyzed_at?: string;
  candidateInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    education?: any[];
    experience?: any[];
    skills?: string[];
    [key: string]: any;
  };
  aspectScores?: {
    skills?: number;
    experience?: number;
    achievements?: number;
    education?: number;
    culturalFit?: number;
    [key: string]: number | undefined;
  };
  metadata?: {
    file_name?: string;
    file_size_mb?: number;
    text_length?: number;
    pages?: number;
    extraction_method?: string;
    original_filename?: string;
    extraction_status?: 'success' | 'fallback' | 'failed';
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
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
  private hasShownConnectionError = false;
  
  constructor() {
    this.atsService = new ATSService();
    console.log('ResumeAnalysisService initialized with API URL:', this.apiUrl);
  }

  // Check if the API is available
  async checkApiStatus(): Promise<boolean> {
    try {
      // Check the root endpoint first which should always be available
      const baseUrl = 'http://localhost:8000';
      console.log('Checking API server at:', baseUrl);
      
      const response = await axios.get(baseUrl, { 
        timeout: 3000,
        headers: { 'Accept': 'application/json' }
      });
      
      console.log('API server is running:', response.status === 200);
      return response.status === 200;
    } catch (error) {
      console.error('API server connection failed:', error);
      // Only show error dialog on first attempt
      if (!this.hasShownConnectionError) {
        this.hasShownConnectionError = true;
        // Alert the user about the connection issue
        const errorMessage = `Could not connect to the AI analysis server. Please make sure it is running at http://localhost:8000

To start the server:
1. Open a terminal in the backend folder
2. Run: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`;
        alert(errorMessage);
      }
      return false;
    }
  }

  // Reset connection error flag when the user tries again
  resetConnectionError() {
    this.hasShownConnectionError = false;
  }

  // Generate mock analysis data when API is unavailable
  private generateMockAnalysis(filename: string): AnalysisResult {
    // Create realistic-looking mock data
    const score = Math.floor(Math.random() * 30) + 60; // Random score between 60-90
    
    // Generate aspect scores that add up to the total score
    const aspectScores = {
      skills: Math.round(score * 0.4 * 10) / 10,
      experience: Math.round(score * 0.3 * 10) / 10,
      achievements: Math.round(score * 0.2 * 10) / 10,
      education: Math.round(score * 0.05 * 10) / 10,
      culturalFit: Math.round(score * 0.05 * 10) / 10
    };
    
    // Generate mock candidate info
    const candidateName = filename.split('.')[0].replace(/_/g, ' ');
    const candidateInfo = {
      name: candidateName.toUpperCase(),
      email: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      skills: [
        "JavaScript", "React", "Node.js", "TypeScript", "Python", 
        "REST APIs", "GraphQL", "CSS", "HTML5", "Git"
      ],
      experience: [
        {
          title: "Senior Software Engineer",
          company: "Tech Solutions Inc.",
          period: "2020 - Present"
        },
        {
          title: "Software Developer",
          company: "WebApp Innovations",
          period: "2017 - 2020"
        }
      ],
      education: [
        {
          degree: "Master of Computer Science",
          institution: "University of Technology",
          year: "2017"
        },
        {
          degree: "Bachelor of Science in Software Engineering",
          institution: "State University",
          year: "2015"
        }
      ]
    };
    
    // Generate mock metadata
    const metadata = {
      file_name: filename,
      file_size_mb: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
      text_length: Math.floor(Math.random() * 15000) + 5000,
      pages: Math.floor(Math.random() * 3) + 1
    };
    
    return {
      filename,
      score,
      matchedKeywords: ['project management', 'team leadership', 'agile', 'communication'].slice(0, 3),
      missingKeywords: ['data analysis', 'python', 'machine learning'].slice(0, 2),
      recommendations: [
        'Add more specific details about your data analysis skills',
        'Include python programming experience if applicable',
        'Highlight any machine learning or AI projects you\'ve worked on'
      ],
      candidateInfo,
      aspectScores,
      metadata,
      analyzed_at: new Date().toISOString()
    };
  }

  async analyzeResume(
    file: File, 
    jobDescription: string, 
    folderId: string = '', 
    userId: string = 'temp_user_id',
    fileId: string = '',
    weights: AspectWeights | null = null,
    useDistilBERT: boolean = false
  ): Promise<AnalysisResult> {
    // Check if mock data is enabled in localStorage
    const useMockData = localStorage.getItem('use_mock_data') === 'true';
    
    if (useMockData) {
      console.log('Using mock data as requested via settings');
      return this.generateMockAnalysis(file.name);
    }
    
    // First check if API is available
    const isApiAvailable = await this.checkApiStatus();
    
    if (!isApiAvailable) {
      console.warn('API server is not available, using mock data for analysis');
      return this.generateMockAnalysis(file.name);
    }
    
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescription);
    formData.append('folder_id', folderId);
    formData.append('user_id', userId);
    
    if (fileId) {
      formData.append('file_id', fileId);
    }
    
    if (weights) {
      formData.append('weights', JSON.stringify(weights));
    }
    
    // Add fallback extraction options
    formData.append('use_distilbert', String(useDistilBERT));
    formData.append('store_results', 'true');
    formData.append('enable_fallback_extraction', 'true');
    
    try {
      console.log(`Analyzing resume: ${file.name}, folder: ${folderId}, fileId: ${fileId}`);
      console.log('API URL:', `${this.apiUrl}/analyze`);
      console.log('Form data:', {
        fileSize: file.size,
        fileName: file.name,
        jobDescriptionLength: jobDescription.length,
        folderId,
        userId,
        fileId,
        weights: weights ? 'provided' : 'not provided',
        useDistilBERT
      });
      
      const response = await axios.post(`${this.apiUrl}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout
      });
      
      console.log('API response received:', response.status, response.statusText);
      
      // Transform the response to match our AnalysisResult interface
      const data = response.data;
      const result: AnalysisResult = {
        filename: data.filename,
        score: data.score,
        matchedKeywords: data.matchedKeywords || [],
        missingKeywords: data.missingKeywords || [],
        recommendations: data.recommendations || [],
        candidateInfo: data.candidateInfo,
        aspectScores: data.aspectScores,
        metadata: data.metadata
      };
      
      // Check if there were PDF extraction issues
      if (data.metadata && data.metadata.extraction_status === 'fallback') {
        console.warn('PDF extraction used fallback method, text quality may be reduced');
        // You can show a warning to the user here if needed
      }
      
      if (data.storage && data.storage.success && data.storage.result_id) {
        result.id = data.storage.result_id;
      }
      
      console.log('Processed result:', result);
      return result;
    } catch (error) {
      console.error('Error analyzing resume:', error);
      
      // Show a more specific error message
      let errorMessage = "An error occurred while analyzing the resume.";
      let errorCode = "unknown_error";
      let useBackup = true;
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with an error status
          if (error.response.status === 500) {
            errorMessage = "Server error (500): The analysis server encountered an internal error.";
            errorCode = "server_error";
            // Show error dialog
            alert(`${errorMessage}\n\nTip: Click "Use Mock Data" to continue testing without the API.`);
          } else if (error.response.status === 400) {
            // Check for PDF extraction issues
            const responseData = error.response.data;
            if (responseData && responseData.detail && 
                (responseData.detail.includes("PDF syntax error") || 
                 responseData.detail.includes("Error extracting text"))) {
              
              errorMessage = "PDF Extraction Error: The document appears to be corrupted or uses an unsupported format.";
              errorCode = "pdf_extraction_error";
              alert(`${errorMessage}\n\nPlease try a different PDF file format or version.`);
              
              // Return a partial result with error information
              return {
                filename: file.name,
                score: 0,
                matchedKeywords: [],
                missingKeywords: [],
                recommendations: ["Please provide a properly formatted PDF document."],
                error: {
                  code: errorCode,
                  message: errorMessage,
                  details: responseData.detail
                },
                metadata: {
                  file_name: file.name,
                  file_size_mb: file.size / (1024 * 1024),
                  extraction_status: 'failed'
                }
              };
            } else {
              // Other bad request errors
              errorMessage = "Error (400): " + (error.response.data?.detail || "Invalid request format");
              errorCode = "bad_request";
              alert(errorMessage);
              useBackup = false; // Don't use mock data for client errors
              throw new Error(errorMessage);
            }
          } else {
            errorMessage = `Error (${error.response.status}): ${error.response.data?.detail || error.message}`;
            errorCode = `http_${error.response.status}`;
            alert(errorMessage);
          }
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = "Network error: No response received from server. Please check your connection.";
          errorCode = "network_error";
          alert(errorMessage);
        } else {
          // Something happened in setting up the request
          errorMessage = "Request error: " + error.message;
          errorCode = "request_setup_error";
          alert(errorMessage);
        }
      } else {
        errorMessage = "Unexpected error: " + (error instanceof Error ? error.message : String(error));
        errorCode = "unexpected_error";
        alert(errorMessage);
      }
      
      if (useBackup) {
        // Ask user if they want to switch to mock data
        const useMock = confirm("Server error occurred. Would you like to use mock data for testing?");
        if (useMock) {
          localStorage.setItem('use_mock_data', 'true');
          console.warn('User chose to switch to mock data');
          return this.generateMockAnalysis(file.name);
        } else {
          localStorage.setItem('use_mock_data', 'false');
          throw error;
        }
      }
      
      throw error;
    }
  }
  
  async analyzeFolderContent(
    files: File[], 
    jobDescription: string,
    folderId: string = '',
    userId: string = 'temp_user_id',
    weights: AspectWeights | null = null,
    useDistilBERT: boolean = false
  ): Promise<AnalysisResult[]> {
    // Check if mock data is enabled in localStorage
    const useMockData = localStorage.getItem('use_mock_data') === 'true';
    
    if (useMockData) {
      console.log('Using mock data as requested via settings for batch analysis');
      return files.map(file => this.generateMockAnalysis(file.name));
    }
    
    // First check if API is available
    const isApiAvailable = await this.checkApiStatus();
    
    if (!isApiAvailable) {
      console.warn('API server is not available, using mock data for batch analysis');
      return files.map(file => this.generateMockAnalysis(file.name));
    }
    
    const formData = new FormData();
    
    // Add files to form data
    files.forEach(file => {
      formData.append('resumes', file);
    });
    
    // Add required parameters
    formData.append('job_description', jobDescription);
    formData.append('folder_id', folderId);
    formData.append('user_id', userId);
    
    // Prepare file_ids mapping if we have file IDs
    const fileIdsMap: Record<string, string> = {};
    files.forEach((file) => {
      // Cast to FileWithId to allow access to id property
      const fileWithId = file as FileWithId;
      if (file.name && fileWithId.id) {
        fileIdsMap[file.name] = fileWithId.id;
      }
    });
    
    if (Object.keys(fileIdsMap).length > 0) {
      formData.append('file_ids', JSON.stringify(fileIdsMap));
    }
    
    if (weights) {
      formData.append('weights', JSON.stringify(weights));
    }
    
    formData.append('use_distilbert', String(useDistilBERT));
    formData.append('store_results', 'true');
    
    try {
      console.log(`Analyzing batch of ${files.length} resumes, folder: ${folderId}`);
      console.log('API URL:', `${this.apiUrl}/analyze-batch`);
      
      const response = await axios.post(`${this.apiUrl}/analyze-batch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 120 second timeout for batch operations
      });
      
      console.log('API response received:', response.status, response.statusText);
      
      // Transform the response to match our AnalysisResult interface
      const results = response.data.results || [];
      return results.map((data: any) => {
        const result: AnalysisResult = {
          filename: data.filename,
          score: data.score,
          matchedKeywords: data.matchedKeywords || [],
          missingKeywords: data.missingKeywords || [],
          recommendations: data.recommendations || [],
          candidateInfo: data.candidateInfo,
          aspectScores: data.aspectScores,
          metadata: data.metadata
        };
        
        if (data.storage && data.storage.success && data.storage.result_id) {
          result.id = data.storage.result_id;
        }
        
        return result;
      });
    } catch (error) {
      console.error('Error analyzing multiple resumes:', error);
      
      // Show a more specific error message
      let errorMessage = "An error occurred while analyzing the resumes.";
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with an error status
          if (error.response.status === 500) {
            errorMessage = "Server error (500): The analysis server encountered an internal error.";
            // Show error dialog
            alert(`${errorMessage}\n\nTip: Click "Use Mock Data" to continue testing without the API.`);
          } else if (error.response.status === 400) {
            // Bad request - could be a file format issue
            errorMessage = "Error (400): " + (error.response.data?.detail || "Invalid request format");
            alert(errorMessage);
          } else {
            errorMessage = `Error (${error.response.status}): ${error.response.data?.detail || error.message}`;
            alert(errorMessage);
          }
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = "Network error: No response received from server. Please check your connection.";
          alert(errorMessage);
        } else {
          // Something happened in setting up the request
          errorMessage = "Request error: " + error.message;
          alert(errorMessage);
        }
      } else {
        errorMessage = "Unexpected error: " + (error instanceof Error ? error.message : String(error));
        alert(errorMessage);
      }
      
      // Enable mock data automatically after server errors
      localStorage.setItem('use_mock_data', 'true');
      console.warn('Automatically switching to mock data due to server error');
      return files.map(file => this.generateMockAnalysis(file.name));
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
      console.log(`ResumeAnalysisService: Getting job description for folder=${folderId}, userId=${userId}`);
      const jobDescription = await this.atsService.getJobDescription(folderId, userId);
      
      if (!jobDescription) {
        console.log(`ResumeAnalysisService: No job description found for folder=${folderId}`);
        return null;
      }
      
      console.log(`ResumeAnalysisService: Found job description id=${jobDescription.id}, folder=${jobDescription.folder_id}, userId=${jobDescription.userId}`);
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
      // Use consistent userId - always use 'temp_user_id' for now
      const userId = 'temp_user_id';
      
      console.log(`Getting analyzed files for folder: ${folderId}, user: ${userId}`);
      
      // Use view-based query which is more reliable
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
      
      const fileIds = (data as AnalyzedFileResult[])
        .filter((item: AnalyzedFileResult) => item && item.file_id)
        .map((item: AnalyzedFileResult) => item.file_id);
      
      console.log(`Found ${fileIds.length} analyzed files in folder ${folderId}`);
      return fileIds;
    } catch (error) {
      console.error('Error in getAnalyzedFilesInFolder:', error);
      return [];
    }
  }
}

export default new ResumeAnalysisService(); 