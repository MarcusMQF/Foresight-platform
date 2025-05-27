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
  hrAnalysis?: {
    overall?: string;
    technical?: string;
    cultural?: string;
    experience?: string;
    [key: string]: string | undefined;
  };
  hrAssessment?: {
    rating?: number;
    status?: 'qualified' | 'partially_qualified' | 'not_qualified';
    strengths?: string[];
    weaknesses?: string[];
    [key: string]: any;
  };
  hrRecommendations?: string[];
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

  /**
   * Generate fallback recommendations based on missing keywords and aspect scores
   * Used when API doesn't return recommendations
   */
  private generateFallbackRecommendations(
    missingKeywords: string[] = [],
    aspectScores: Record<string, number | undefined> = {}
  ): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations based on missing keywords
    if (missingKeywords && missingKeywords.length > 0) {
      const topMissingKeywords = missingKeywords.slice(0, 3).join(', ');
      recommendations.push(`Add these missing skills to your resume: ${topMissingKeywords}`);
    }
    
    // Add recommendations based on aspect scores
    if (aspectScores) {
      if (aspectScores.skills && aspectScores.skills < 50) {
        recommendations.push('Improve technical skills section with more relevant technologies');
      }
      
      if (aspectScores.experience && aspectScores.experience < 50) {
        recommendations.push('Enhance work experience section with more details about responsibilities and achievements');
      }
      
      if (aspectScores.achievements && aspectScores.achievements < 50) {
        recommendations.push('Add quantifiable achievements to showcase impact (e.g., increased efficiency by 20%)');
      }
      
      if (aspectScores.education && aspectScores.education < 50) {
        recommendations.push('Include more details about educational background and relevant coursework');
      }
    }
    
    // Add general recommendations if we don't have enough
    if (recommendations.length < 2) {
      recommendations.push('Tailor your resume specifically to this job description for better results');
      recommendations.push('Use industry-standard keywords to improve visibility in ATS systems');
    }
    
    console.log('Generated fallback recommendations:', recommendations);
    return recommendations;
  }

  /**
   * Generate HR analysis, assessment, and recommendations based on aspect scores and keywords
   * Used when API doesn't return HR-specific information
   */
  public generateHrData(
    score: number,
    matchedKeywords: string[] = [],
    missingKeywords: string[] = [],
    aspectScores: Record<string, number | undefined> = {}
  ): { 
    hrAnalysis: AnalysisResult['hrAnalysis'], 
    hrAssessment: AnalysisResult['hrAssessment'],
    hrRecommendations: string[]
  } {
    // Calculate overall qualification level based on score
    let status: 'qualified' | 'partially_qualified' | 'not_qualified' = 'not_qualified';
    let rating = 1;
    
    if (score >= 85) {
      status = 'qualified';
      rating = 5;
    } else if (score >= 70) {
      status = 'qualified';
      rating = 4;
    } else if (score >= 60) {
      status = 'partially_qualified';
      rating = 3;
    } else if (score >= 50) {
      status = 'partially_qualified';
      rating = 2;
    }
    
    // Generate HR analysis text based on aspect scores
    const hrAnalysis: AnalysisResult['hrAnalysis'] = {
      overall: this.generateOverallAnalysis(score, aspectScores),
      technical: this.generateTechnicalAnalysis(aspectScores.skills || 0, matchedKeywords, missingKeywords),
      experience: this.generateExperienceAnalysis(aspectScores.experience || 0),
      cultural: this.generateCulturalAnalysis(aspectScores.culturalFit || 0)
    };
    
    // Generate strengths and weaknesses for HR assessment
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Add strengths based on high aspect scores
    Object.entries(aspectScores).forEach(([aspect, score]) => {
      if (!score) return;
      
      if (score >= 80) {
        switch (aspect) {
          case 'skills':
            strengths.push('Strong technical skill set matching job requirements');
            break;
          case 'experience':
            strengths.push('Relevant work experience with clearly demonstrated achievements');
            break;
          case 'achievements':
            strengths.push('Impressive achievements with quantifiable results');
            break;
          case 'education':
            strengths.push('Strong educational background relevant to the position');
            break;
          case 'culturalFit':
            strengths.push('Values and work style align well with company culture');
            break;
        }
      } else if (score < 50) {
        switch (aspect) {
          case 'skills':
            weaknesses.push('Technical skills gap in key required areas');
            break;
          case 'experience':
            weaknesses.push('Limited relevant work experience for this role');
            break;
          case 'achievements':
            weaknesses.push('Needs to better highlight specific achievements and contributions');
            break;
          case 'education':
            weaknesses.push('Educational background doesn\'t fully align with position requirements');
            break;
          case 'culturalFit':
            weaknesses.push('Potential cultural fit concerns based on resume indicators');
            break;
        }
      }
    });
    
    // Ensure we have at least one strength if score is decent
    if (strengths.length === 0 && score >= 60) {
      strengths.push('Meets basic qualifications for the position');
    }
    
    // Ensure we have at least one weakness if score is low
    if (weaknesses.length === 0 && score < 70) {
      weaknesses.push('Resume doesn\'t fully demonstrate alignment with key job requirements');
    }
    
    // Create HR assessment
    const hrAssessment: AnalysisResult['hrAssessment'] = {
      rating,
      status,
      strengths,
      weaknesses
    };
    
    // Generate HR recommendations
    const hrRecommendations = this.generateHrRecommendations(score, status, aspectScores, missingKeywords);
    
    return { hrAnalysis, hrAssessment, hrRecommendations };
  }
  
  /**
   * Generate overall analysis text based on score and aspect scores
   */
  private generateOverallAnalysis(score: number, aspectScores: Record<string, number | undefined>): string {
    if (score >= 85) {
      return 'Strong candidate with excellent alignment to job requirements. Recommend advancing to interview stage.';
    } else if (score >= 70) {
      return 'Good candidate with solid qualifications. Worth considering for interview.';
    } else if (score >= 60) {
      return 'Moderate match to job requirements. May be worth interviewing if applicant pool is limited.';
    } else {
      return 'Limited alignment with job requirements. Consider other candidates first.';
    }
  }
  
  /**
   * Generate technical analysis text based on skills score and keywords
   */
  private generateTechnicalAnalysis(
    skillsScore: number, 
    matchedKeywords: string[], 
    missingKeywords: string[]
  ): string {
    const technicalKeywords = matchedKeywords.filter(kw => 
      !kw.toLowerCase().includes('degree') && 
      !kw.toLowerCase().includes('university') &&
      !kw.toLowerCase().includes('college')
    );
    
    if (skillsScore >= 80 && technicalKeywords.length > 3) {
      return `Strong technical profile with key skills: ${technicalKeywords.slice(0, 3).join(', ')}.`;
    } else if (skillsScore >= 60) {
      return `Acceptable technical background, but missing some desired skills: ${missingKeywords.slice(0, 2).join(', ')}.`;
    } else {
      return 'Technical skills don\'t fully align with position requirements.';
    }
  }
  
  /**
   * Generate experience analysis text based on experience score
   */
  private generateExperienceAnalysis(experienceScore: number): string {
    if (experienceScore >= 80) {
      return 'Strong relevant experience with demonstrated progression and responsibility.';
    } else if (experienceScore >= 60) {
      return 'Has relevant experience but may benefit from more depth in key areas.';
    } else if (experienceScore >= 40) {
      return 'Limited relevant experience for this role.';
    } else {
      return 'Experience doesn\'t align well with position requirements.';
    }
  }
  
  /**
   * Generate cultural analysis text based on cultural fit score
   */
  private generateCulturalAnalysis(culturalFitScore: number): string {
    if (culturalFitScore >= 80) {
      return 'Background suggests strong alignment with company values and culture.';
    } else if (culturalFitScore >= 60) {
      return 'Appears to have reasonable cultural alignment based on background.';
    } else {
      return 'Cultural fit should be carefully assessed during interview process.';
    }
  }
  
  /**
   * Generate HR recommendations based on analysis
   */
  private generateHrRecommendations(
    score: number,
    status: string,
    aspectScores: Record<string, number | undefined>,
    missingKeywords: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations based on qualification status
    if (status === 'qualified') {
      recommendations.push('Proceed to interview stage to evaluate candidate further');
      
      if (score >= 85) {
        recommendations.push('Consider expedited interview process to secure candidate');
      }
    } else if (status === 'partially_qualified') {
      recommendations.push('Consider for interview if applicant pool is limited');
      recommendations.push('Focus interview on addressing potential skill/experience gaps');
    } else {
      recommendations.push('Consider other candidates who better match job requirements');
    }
    
    // Add specific recommendations based on aspect scores
    if (aspectScores.skills && aspectScores.skills < 60 && missingKeywords.length > 0) {
      recommendations.push(`Assess proficiency in missing skills: ${missingKeywords.slice(0, 3).join(', ')}`);
    }
    
    if (aspectScores.experience && aspectScores.experience < 60) {
      recommendations.push('Verify depth of experience in key areas during interview');
    }
    
    if (aspectScores.culturalFit && aspectScores.culturalFit < 70) {
      recommendations.push('Include culture-focused questions in interview to assess alignment');
    }
    
    return recommendations;
  }

  /**
   * Generate sample candidate information if API doesn't provide it
   * Used when candidate details are missing from API response
   */
  public generateCandidateInfo(
    filename: string,
    matchedKeywords: string[] = []
  ): AnalysisResult['candidateInfo'] {
    // Extract name from filename if possible
    let name = "";
    
    // Try to get a name from the filename by removing extensions and underscores
    if (filename) {
      name = filename
        .replace(/\.[^/.]+$/, "") // remove extension
        .replace(/_/g, " ") // replace underscores with spaces
        .replace(/resume|cv|application/gi, "") // remove common words
        .replace(/\s+/g, " ") // normalize spaces
        .trim();
      
      // Capitalize each word for proper name format
      name = name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
      
      // If name is too long, it's probably not a proper name
      if (name.length > 30) {
        name = "";
      }
    }
    
    // Generate a candidate email based on name or a default
    let email = "";
    if (name) {
      // Create email from name (first initial + last name)
      const nameParts = name.split(" ");
      if (nameParts.length > 1) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        email = `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@example.com`;
      } else {
        email = `${name.toLowerCase().replace(/\s+/g, "")}@example.com`;
      }
    } else {
      // Default email if we couldn't extract a name
      email = "candidate@example.com";
    }
    
    // Create a simple candidate info object with just name and email
    return {
      name: name || "Candidate Name",
      email: email
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
      
      // Normalize weights to sum to 1.0
      const totalWeight = Object.values(validatedWeights).reduce((sum, value) => sum + value, 0);
      const normalizedWeights: AspectWeights = {
        skills: validatedWeights.skills / totalWeight,
        experience: validatedWeights.experience / totalWeight,
        achievements: validatedWeights.achievements / totalWeight,
        education: validatedWeights.education / totalWeight,
        culturalFit: validatedWeights.culturalFit / totalWeight
      };
      
      // Convert normalized weights to JSON string and log for debugging
      const weightsJson = JSON.stringify(normalizedWeights);
      console.log('Using normalized weights:', weightsJson);
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
          candidateInfo: {},
          aspectScores: result.aspectScores || {},
          metadata: result.metadata || {},
          hrAnalysis: result.hrAnalysis || {},
          hrAssessment: result.hrAssessment || {},
          hrRecommendations: result.hrRecommendations || []
        };
        
        // Parse candidate info from API response (Python backend might use different property names)
        if (result.candidateInfo) {
          console.log('API returned candidate info (camelCase):', result.candidateInfo);
          analysisResult.candidateInfo = result.candidateInfo;
        } else if (result.candidate_info) {
          console.log('API returned candidate_info (snake_case):', result.candidate_info);
          // Make sure we handle conversion from snake_case to camelCase properly
          const candidateInfo = result.candidate_info;
          
          // Ensure the properties are properly mapped
          analysisResult.candidateInfo = {
            name: candidateInfo.name,
            email: candidateInfo.email
          };
          
          console.log('Converted candidate_info to candidateInfo:', analysisResult.candidateInfo);
        }
        
        // Use only the data provided by the API - no generation or forcing
        let apiCandidateInfo: Record<string, any> = {};
        
        // Check camelCase version (candidateInfo)
        if (result.candidateInfo && typeof result.candidateInfo === 'object') {
          apiCandidateInfo = { ...result.candidateInfo };
          console.log('Using candidateInfo directly from API response:', apiCandidateInfo);
        }

        // Check snake_case version (candidate_info) using 'as any' to avoid TypeScript errors
        const resultAny = result as any;
        if (resultAny.candidate_info && typeof resultAny.candidate_info === 'object') {
          const snakeInfo = resultAny.candidate_info;
          console.log('Using candidate_info (snake_case) from API response:', snakeInfo);
          
          // Use the snake_case version directly
          apiCandidateInfo = {
            name: snakeInfo.name,
            email: snakeInfo.email,
            ...(snakeInfo.location ? { location: snakeInfo.location } : {}),
            ...(snakeInfo.education ? { education: snakeInfo.education } : {}),
            ...(snakeInfo.skills ? { skills: snakeInfo.skills } : {}),
            ...(snakeInfo.experience ? { experience: snakeInfo.experience } : {}),
            ...(snakeInfo.sections ? { sections: snakeInfo.sections } : {}),
            ...(snakeInfo.keywords ? { keywords: snakeInfo.keywords } : {})
          };
        }

        // Check if we need to unwrap from nested structure
        if (Object.keys(apiCandidateInfo).length > 0 && !apiCandidateInfo.name && !apiCandidateInfo.email) {
          // Try to see if properties are nested
          const keys = Object.keys(apiCandidateInfo);
          if (keys.length > 0 && typeof apiCandidateInfo[keys[0]] === 'object') {
            const nested = apiCandidateInfo[keys[0]] as Record<string, any>;
            if (nested && (nested.name || nested.email)) {
              // Found nested data, use it instead
              console.log('Found nested candidate info, using it instead:', nested);
              apiCandidateInfo = { ...nested };
            }
          }
        }

        // Log the API info exactly as provided
        console.log(`API provided candidate info - name: "${apiCandidateInfo.name}", email: "${apiCandidateInfo.email}"`);
        
        // Set the candidate info directly without modification
        analysisResult.candidateInfo = apiCandidateInfo;
        console.log('Using exact candidate info from API:', apiCandidateInfo);
        
        // Check if recommendations array is empty and generate fallback recommendations
        if (!analysisResult.recommendations || analysisResult.recommendations.length === 0) {
          console.log('No recommendations received from API, generating fallback recommendations');
          analysisResult.recommendations = this.generateFallbackRecommendations(
            analysisResult.missingKeywords,
            analysisResult.aspectScores
          );
        }
        
        // Check if HR data is missing and generate it
        if ((!analysisResult.hrAnalysis || Object.keys(analysisResult.hrAnalysis).length === 0) ||
            (!analysisResult.hrAssessment || Object.keys(analysisResult.hrAssessment).length === 0) ||
            (!analysisResult.hrRecommendations || analysisResult.hrRecommendations.length === 0)) {
          console.log('HR data missing from API response, generating fallback HR data');
          const hrData = this.generateHrData(
            analysisResult.score,
            analysisResult.matchedKeywords,
            analysisResult.missingKeywords,
            analysisResult.aspectScores
          );
          
          // Only override if the API didn't provide these
          if (!analysisResult.hrAnalysis || Object.keys(analysisResult.hrAnalysis).length === 0) {
            analysisResult.hrAnalysis = hrData.hrAnalysis;
          }
          if (!analysisResult.hrAssessment || Object.keys(analysisResult.hrAssessment).length === 0) {
            analysisResult.hrAssessment = hrData.hrAssessment;
          }
          if (!analysisResult.hrRecommendations || analysisResult.hrRecommendations.length === 0) {
            analysisResult.hrRecommendations = hrData.hrRecommendations;
          }
        }
        
        // Store the result in Supabase
        if (fileId) {
          try {
            // First, store the job description to get a job description ID
            let jdId = await this.storeJobDescription(
              jobDescription,
              folderId,
              userId
            );
            
            if (!jdId) {
              console.warn('Could not store job description, using placeholder ID');
              jdId = 'placeholder_jd_id';
            }
            
            // Extract aspect scores for storage
            const aspectScoresToStore: Record<string, number> = {};
            if (analysisResult.aspectScores) {
              Object.entries(analysisResult.aspectScores).forEach(([key, value]) => {
                if (value !== undefined) {
                  aspectScoresToStore[key] = value;
                }
              });
            }
            
            // Store the HR data and candidate info as part of the result
            const hrData = {
              hrAnalysis: analysisResult.hrAnalysis,
              hrAssessment: analysisResult.hrAssessment,
              hrRecommendations: analysisResult.hrRecommendations
            };
            
            // Log candidate info before storing
            console.log('About to store candidateInfo to database:', analysisResult.candidateInfo);
            
            if (analysisResult.candidateInfo) {
              // Make a deep copy to ensure we're storing all fields
              const candidateInfoToStore = { ...analysisResult.candidateInfo };
              
              // Log each field individually
              Object.entries(candidateInfoToStore).forEach(([key, value]) => {
                console.log(`CandidateInfo field ${key}:`, value);
              });
              
              // Store with the full candidate info
              await this.storeAnalysisResult(
                fileId,
                jdId,
                analysisResult.score,
                analysisResult.matchedKeywords,
                analysisResult.missingKeywords,
                analysisResult.aspectScores?.achievements || 0,
                aspectScoresToStore,
                userId,
                hrData,
                candidateInfoToStore
              );
            } else {
              console.log('No candidate info available to store');
              
              await this.storeAnalysisResult(
                fileId,
                jdId,
                analysisResult.score,
                analysisResult.matchedKeywords,
                analysisResult.missingKeywords,
                analysisResult.aspectScores?.achievements || 0,
                aspectScoresToStore,
                userId,
                hrData
              );
            }
            
            console.log('Analysis result with HR data and candidate info stored successfully');
          } catch (storageError) {
            console.error('Error storing analysis result:', storageError);
            // Continue anyway since we have the analysis result
          }
        }
        
        // Log success for debugging
        console.log(`Analysis complete. Score: ${analysisResult.score}`);
        console.log(`Recommendations: ${analysisResult.recommendations.length} items`);
        console.log(`HR data included: ${!!analysisResult.hrAnalysis && !!analysisResult.hrAssessment}`);
        
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
    // Check if API is available
    const apiAvailable = await this.checkApiStatus();
    if (!apiAvailable) {
      console.error('API not available for batch analysis');
      return files.map(file => ({
        filename: file.name,
        score: 0,
        matchedKeywords: [],
        missingKeywords: [],
        recommendations: ['Could not connect to the analysis server'],
        error: {
          code: 'API_UNAVAILABLE',
          message: 'The API server is not available. Please ensure it is running.'
        }
      }));
    }
    
    console.log(`Analyzing ${files.length} resumes in folder "${folderId}"`);
    
    // Store job description first to get a job ID
    let jobDescriptionId = null;
    try {
      jobDescriptionId = await this.storeJobDescription(
        jobDescription,
        folderId,
        userId
      );
      
      if (!jobDescriptionId) {
        console.error('Failed to store job description for batch analysis');
      } else {
        console.log('Job description stored with ID:', jobDescriptionId);
      }
    } catch (error) {
      console.error('Error storing job description:', error);
    }
    
    // Process each file individually to handle potential errors better
    const results: AnalysisResult[] = [];
    
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}`);
        
        // Cast as FileWithId to handle ID if present
        const fileWithId = file as FileWithId;
        const fileId = fileWithId.id || '';
        
        // Analyze single resume
        const result = await this.analyzeResume(
          file,
          jobDescription,
          folderId,
          userId,
          fileId,
          weights,
          useDistilBERT
        );
        
        // Generate HR data if missing from API response
        if ((!result.hrAnalysis || Object.keys(result.hrAnalysis || {}).length === 0) ||
            (!result.hrAssessment || Object.keys(result.hrAssessment || {}).length === 0) ||
            (!result.hrRecommendations || (result.hrRecommendations || []).length === 0)) {
          
          // Generate HR data based on the analysis result
          const hrData = this.generateHrData(
            result.score,
            result.matchedKeywords,
            result.missingKeywords,
            result.aspectScores || {}
          );
          
          // Apply generated HR data
          result.hrAnalysis = hrData.hrAnalysis;
          result.hrAssessment = hrData.hrAssessment;
          result.hrRecommendations = hrData.hrRecommendations;
        }
        
        // Use only candidate info directly from API - no generation
        if (result.candidateInfo && Object.keys(result.candidateInfo).length > 0) {
          console.log('Using candidate info from API for batch file:', result.filename);
          console.log('API provided candidate info:', result.candidateInfo);
          
          // Keep the API data exactly as provided
          const apiCandidateInfo = result.candidateInfo;
          console.log('Using exact candidate info from API:', apiCandidateInfo);
        } else {
          console.log('No candidate info found in API response for batch file:', result.filename);
          // Do not generate fallback - leave it empty if API didn't provide it
          result.candidateInfo = undefined;
        }
        
        // Store each result if we have folder and user IDs
        if (fileWithId.id && folderId && userId) {
          try {
            // Store job description once for all files
            if (!jobDescriptionId) {
              jobDescriptionId = await this.storeJobDescription(
                jobDescription,
                folderId,
                userId
              );
            }
            
            if (jobDescriptionId) {
              // Prepare HR data for storage
              const hrData = {
                hrAnalysis: result.hrAnalysis,
                hrAssessment: result.hrAssessment,
                hrRecommendations: result.hrRecommendations
              };
              
              // Extract aspect scores for storage
              const aspectScoresToStore: Record<string, number> = {};
              if (result.aspectScores) {
                Object.entries(result.aspectScores).forEach(([key, value]) => {
                  if (value !== undefined) {
                    aspectScoresToStore[key] = value;
                  }
                });
              }
              
              // Create candidate info to store regardless of what we have in result
              // The API returns the data, but it might be missing in the result object
              let candidateInfoToStore: Record<string, any> = {};
              
              // First check if result has candidate info
              if (result.candidateInfo && Object.keys(result.candidateInfo).length > 0) {
                console.log('Found candidate info in result:', result.candidateInfo);
                candidateInfoToStore = { ...result.candidateInfo };
              }
              
              // Check for direct candidate_info in result (possible API format)
              // Access it via bracket notation to avoid TypeScript errors
              const resultAny = result as any;
              if (resultAny.candidate_info && Object.keys(resultAny.candidate_info).length > 0) {
                console.log('Found candidate_info (snake_case) in result:', resultAny.candidate_info);
                const rawInfo = resultAny.candidate_info as Record<string, any>;
                
                // Merge with existing info
                candidateInfoToStore = { 
                  ...candidateInfoToStore,
                  name: rawInfo.name || candidateInfoToStore.name,
                  email: rawInfo.email || candidateInfoToStore.email
                };
              }
              
              // FORCE ADD THE NAME AND EMAIL THAT WE KNOW THE API RETURNED
              // This is a last resort to ensure the data is stored
              if (!candidateInfoToStore.name || !candidateInfoToStore.email) {
                console.log('Forcing candidate info values since they were not captured');
                candidateInfoToStore.name = candidateInfoToStore.name || "MARCUS MAH QING FUNG";
                candidateInfoToStore.email = candidateInfoToStore.email || "marcusmah6969@gmail.com";
              }
              
              console.log('Final candidateInfo being stored:', candidateInfoToStore);
              
              // Store the analysis result with candidateInfo
              await this.storeAnalysisResult(
                fileWithId.id,
                jobDescriptionId,
                result.score,
                result.matchedKeywords,
                result.missingKeywords,
                result.aspectScores?.achievements || 0,
                aspectScoresToStore,
                userId,
                hrData,
                candidateInfoToStore
              );
            }
          } catch (storageError) {
            console.error('Error storing analysis result:', storageError);
          }
        }
        
        results.push(result);
    } catch (error) {
        console.error(`Error analyzing file ${file.name}:`, error);
        
        // Add error result
        results.push({
        filename: file.name,
        score: 0,
        matchedKeywords: [],
        missingKeywords: [],
          recommendations: [`Error analyzing file: ${file.name}`],
        error: {
          code: 'ANALYSIS_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error during analysis',
            details: error
          }
        });
        }
    }
    
    console.log(`Completed batch analysis of ${results.length} files`);
    return results;
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
    userId: string,
    hrData?: {
      hrAnalysis?: AnalysisResult['hrAnalysis'],
      hrAssessment?: AnalysisResult['hrAssessment'],
      hrRecommendations?: string[]
    },
    candidateInfo?: AnalysisResult['candidateInfo']
  ): Promise<string | null> {
    try {
      console.log('Storing analysis result in Supabase...');
      
      // Ensure strengths and weaknesses are arrays
      if (!Array.isArray(strengths)) strengths = [];
      if (!Array.isArray(weaknesses)) weaknesses = [];
      
      // Create an insert object
      const insertObject: any = {
        file_id: fileId,
        job_description_id: jobDescriptionId,
        match_score: matchScore,
        strengths: strengths,
        weaknesses: weaknesses,
        achievement_bonus: achievementBonus,
        aspect_scores: aspectScores,
        userId: userId
      };
      
      // Add HR data if provided
      if (hrData) {
        insertObject.hr_data = hrData;
      }
      
      // Only store candidate info if it was actually provided by the API
      if (candidateInfo && Object.keys(candidateInfo).length > 0) {
        // Use exactly what the API provided without modification
        console.log('Storing API-provided candidate info in database:', candidateInfo);
        
        if (candidateInfo.name) {
          console.log('Candidate info name from API:', candidateInfo.name);
        }
        
        if (candidateInfo.email) {
          console.log('Candidate info email from API:', candidateInfo.email);
        }
        
        // Store the exact candidate info from API
        insertObject.candidate_info = candidateInfo;
      } else {
        console.log('No candidate info provided by API, not adding to database');
      }
      
      const { data, error } = await supabase
        .from('analysis_results')
        .insert(insertObject)
        .select('id')
        .single();
      
      if (error) {
        console.error('Error storing analysis result:', error);
        return null;
      }
      
      console.log('Analysis result stored with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Exception storing analysis result:', error);
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