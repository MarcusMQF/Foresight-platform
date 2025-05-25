import axios from 'axios';
import { supabase } from '../lib/supabase';
import { ATSService } from './ats.service';
import { API_BASE_URL, API_ENDPOINTS, getApiUrl, checkApiAvailability } from './api-config';

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
  private apiUrl = getApiUrl('/api');
  private atsService: ATSService;
  private hasShownConnectionError = false;
  
  constructor() {
    this.atsService = new ATSService();
    console.log('ResumeAnalysisService initialized with API URL:', this.apiUrl);
  }

  // Check if the API is available
  async checkApiStatus(): Promise<boolean> {
    try {
      // Use the helper function from api-config
      const isAvailable = await checkApiAvailability();
      
      console.log('API server is running:', isAvailable);
      
      if (!isAvailable && !this.hasShownConnectionError) {
        this.hasShownConnectionError = true;
        // Alert the user about the connection issue
        const errorMessage = `Could not connect to the AI analysis server. Please make sure it is running at ${API_BASE_URL}

To start the server:
1. Open a terminal in the backend folder
2. Run: python -m uvicorn app.main:app --host 0.0.0.0 --port 8001`;
        alert(errorMessage);
      }
      
      return isAvailable;
    } catch (error) {
      console.error('API server connection failed:', error);
      return false;
    }
  }

  // Reset connection error flag when the user tries again
  resetConnectionError() {
    this.hasShownConnectionError = false;
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
    // Always disable mock data
    localStorage.setItem('use_mock_data', 'false');
    
    // Check if API is available
    const apiAvailable = await this.checkApiStatus();
    if (!apiAvailable) {
      console.error('API not available, returning error result');
      return {
        filename: file.name,
        score: 0,
        matchedKeywords: [],
        missingKeywords: [],
        recommendations: ['Could not connect to the analysis server'],
        error: {
          code: 'API_UNAVAILABLE',
          message: 'The API server is not available. Please ensure it is running.'
        }
      };
    }
    
    console.log(`Analyzing resume: ${file.name}`);
    console.log(`Job description length: ${jobDescription.length} characters`);
    
    // Create form data
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescription);
    formData.append('folder_id', folderId);
    formData.append('user_id', userId);
    formData.append('use_distilbert', String(useDistilBERT));
    formData.append('enable_fallback_extraction', 'true'); // Always enable fallback extraction
    
    // Add file ID if provided
    if (fileId) {
      formData.append('file_id', fileId);
    }
    
    // Add weights if provided
    if (weights) {
      // Ensure all weight values are valid numbers
      const validatedWeights = { ...weights };
      for (const key in validatedWeights) {
        if (isNaN(validatedWeights[key as keyof AspectWeights])) {
          validatedWeights[key as keyof AspectWeights] = 1; // Default to 1 if invalid
        }
      }
      
      // Convert weights to JSON string and log for debugging
      const weightsJson = JSON.stringify(validatedWeights);
      console.log('Using custom weights:', weightsJson);
      formData.append('weights', weightsJson);
    } else {
      console.log('Using default weights (not provided)');
    }
    
    try {
      console.log('Sending analysis request to API...');
      const response = await axios.post(`${this.apiUrl}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 seconds timeout for potentially slow extraction
      });
      
      console.log('Analysis response received:', response.status);
      
      if (response.status === 200 && response.data) {
        const result = response.data;
        
        // Ensure the result has the expected structure
        const analysisResult: AnalysisResult = {
          filename: file.name,
          score: result.score || 0,
          matchedKeywords: result.matchedKeywords || [],
          missingKeywords: result.missingKeywords || [],
          recommendations: result.recommendations || [],
          candidateInfo: result.candidateInfo || {},
          aspectScores: result.aspectScores || {},
          metadata: result.metadata || {}
        };
        
        // Log success for debugging
        console.log(`Analysis complete. Score: ${analysisResult.score}`);
        
        return analysisResult;
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      
      // Try to extract error message
      let errorMessage = 'Failed to analyze resume';
      let errorDetails = null;
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = error.response.data.detail || error.message;
          errorDetails = error.response.data;
          console.error('API error response:', error.response.data);
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = 'No response received from server';
        } else {
          // Something happened in setting up the request
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Return a structured error result
      return {
        filename: file.name,
        score: 0,
        matchedKeywords: [],
        missingKeywords: [],
        recommendations: [errorMessage],
        error: {
          code: 'ANALYSIS_FAILED',
          message: errorMessage,
          details: errorDetails
        }
      };
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
    // Always disable mock data
    localStorage.setItem('use_mock_data', 'false');
    
    // Skip analysis if no files are provided
    if (!files || files.length === 0) {
      console.log('No files provided for analysis');
      return [];
    }
    
    // First check if API is available
    const isApiAvailable = await this.checkApiStatus();
    
    if (!isApiAvailable) {
      console.error('API server is not available for batch analysis');
      return files.map(file => ({
        filename: file.name,
        score: 0,
        matchedKeywords: [],
        missingKeywords: [],
        recommendations: ['API server is not available. Please ensure it is running.'],
        error: {
          code: 'API_UNAVAILABLE',
          message: 'The API server is not available. Please ensure it is running.'
        }
      }));
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
            alert(`${errorMessage}\n\nPlease check the server logs for more information.`);
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
      
      // Return error results for each file
      return files.map(file => ({
        filename: file.name,
        score: 0,
        matchedKeywords: [],
        missingKeywords: [],
        recommendations: [errorMessage],
        error: {
          code: 'ANALYSIS_FAILED',
          message: errorMessage
        }
      }));
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

  // Test PDF text extraction without performing analysis
  async testPdfExtraction(file: File): Promise<{
    success: boolean;
    filename: string;
    text_sample?: string;
    text_length?: number;
    metadata?: any;
    error?: string;
  }> {
    // Check if API is available
    const apiAvailable = await this.checkApiStatus();
    if (!apiAvailable) {
      console.error('API not available for PDF extraction test');
      return {
        success: false,
        filename: file.name,
        error: 'The API server is not available. Please ensure it is running.'
      };
    }
    
    console.log(`Testing PDF extraction for: ${file.name}`);
    
    // Create form data
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('enable_fallback_extraction', 'true');
    
    try {
      console.log('Sending test extraction request to API...');
      const response = await axios.post(getApiUrl(API_ENDPOINTS.TEST_EXTRACTION), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 seconds timeout for extraction
      });
      
      console.log('Test extraction response received:', response.status);
      
      if (response.status === 200 && response.data) {
        const result = response.data;
        return {
          success: true,
          filename: file.name,
          text_sample: result.text_sample,
          text_length: result.text_length,
          metadata: result.metadata
        };
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('Error testing PDF extraction:', error);
      
      // Extract error message
      let errorMessage = 'Failed to extract text from PDF';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data.detail || error.message;
        } else if (error.request) {
          errorMessage = 'No response received from server';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        filename: file.name,
        error: errorMessage
      };
    }
  }
}

export default new ResumeAnalysisService(); 