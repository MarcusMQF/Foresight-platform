import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, Zap, Clock, Settings, ChevronDown, ChevronUp, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { AnalysisResult, AspectWeights } from '../../services/resume-analysis.service';
import resumeAnalysisService from '../../services/resume-analysis.service';
import { FileItem } from '../../services/documents.service';
import { useNavigate, useParams } from 'react-router-dom';
import WeightSlider from '../UI/WeightSlider';
import { supabase } from '../../lib/supabase';

interface ATSCheckerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderFiles?: FileItem[]; // Files from the current folder
}

const USE_MOCK_DATA_KEY = 'use_mock_data';

const ATSCheckerDialog: React.FC<ATSCheckerDialogProps> = ({ 
  isOpen, 
  onClose,
  folderFiles = []
}) => {
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId: string }>();
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [showWeightSettings, setShowWeightSettings] = useState(false);
  const [filesToAnalyze, setFilesToAnalyze] = useState<FileItem[]>([]);
  const [loadingJobDescription, setLoadingJobDescription] = useState(false);
  const [useMockData, setUseMockData] = useState<boolean>(
    localStorage.getItem(USE_MOCK_DATA_KEY) !== 'false'
  );
  
  // Initialize weights with default values
  const [weights, setWeights] = useState<AspectWeights>({
    skills: 40,
    experience: 30,
    achievements: 20,
    education: 5,
    culturalFit: 5
  });
  
  // Load job description when dialog is opened
  useEffect(() => {
    if (isOpen && folderId) {
      console.log('ATSCheckerDialog opened for folder:', folderId);
      const loadJobDescription = async () => {
        setLoadingJobDescription(true);
        try {
          // Use consistent userId - always use 'temp_user_id' for now
          const userId = 'temp_user_id';
          
          console.log(`Attempting to load job description for folder ${folderId} and user ${userId}`);
          
          // Direct database query to check what job descriptions exist
          try {
            const { data: allJobDescriptions, error: queryError } = await supabase
              .from('job_descriptions')
              .select('*')
              .eq('folder_id', folderId);
              
            if (queryError) {
              console.error('Error querying job descriptions:', queryError);
            } else {
              console.log(`Direct query found ${allJobDescriptions?.length || 0} job descriptions for folder ${folderId}:`);
              allJobDescriptions?.forEach(jd => {
                console.log(`- ID: ${jd.id}, userId: ${jd.userId}, created: ${jd.created_at}, length: ${jd.description.length}`);
              });
            }
          } catch (directQueryError) {
            console.error('Error in direct job descriptions query:', directQueryError);
          }
          
          // Try to load job description from database
          const jobDesc = await resumeAnalysisService.getLatestJobDescription(folderId, userId);
          
          if (jobDesc) {
            console.log(`Loaded job description from database: ID=${jobDesc.id}, Content="${jobDesc.description.substring(0, 30)}..."`);
            setJobDescription(jobDesc.description);
          } else {
            // No job description found for this folder, start with empty
            console.log('No job description found for folder:', folderId);
            setJobDescription('');
          }
        } catch (error) {
          console.error('Error loading job description:', error);
          setJobDescription('');
        } finally {
          setLoadingJobDescription(false);
        }
      };
      
      loadJobDescription();
    }
  }, [isOpen, folderId]);
  
  // Reset state when dialog is opened
  useEffect(() => {
    if (isOpen) {
      setResults(null);
      setAnalyzing(false);
      setProgress(0);
      setProcessingStep('');
      
      // Store the files to analyze
      setFilesToAnalyze(folderFiles);
      
      // Set batch mode if multiple files are available
      setIsBatchMode(folderFiles.length > 1);
      
      // Reset connection error flag in resume analysis service
      resumeAnalysisService.resetConnectionError();
      
      // Check if API is available
      resumeAnalysisService.checkApiStatus().then(isAvailable => {
        console.log('API connection check:', isAvailable ? 'available' : 'unavailable');
      });
      
      console.log('Files available for analysis:', folderFiles.length);
    }
  }, [isOpen, folderFiles]);

  // Update progress during analysis
  useEffect(() => {
    if (!analyzing) return;
    
    const totalTime = filesToAnalyze.length > 1 ? filesToAnalyze.length * 500 : 3000; // Same as setTimeout in handleSubmit
    const totalSteps = 100; // We want 100 steps for 0-100%
    const stepTime = totalTime / totalSteps;
    
    // Start progress at 1% immediately for better user feedback
    setProgress(1);
    console.log('Starting progress tracking, total time:', totalTime, 'ms');
    
    let currentProgress = 1;
    const interval = setInterval(() => {
      currentProgress = Math.min(98, currentProgress + 1);
      setProgress(currentProgress);
      
      // Log progress every 10%
      if (currentProgress % 10 === 0) {
        console.log(`Analysis progress: ${currentProgress}%`);
      }
      
      // Stop at 98% and wait for the actual completion
      if (currentProgress >= 98) {
        console.log('Progress reached 98%, waiting for completion');
        clearInterval(interval);
      }
    }, stepTime);

    return () => {
      console.log('Clearing progress interval');
      clearInterval(interval);
    };
  }, [analyzing, filesToAnalyze.length]);

  // Update estimated time based on number of files
  useEffect(() => {
    if (!analyzing) return;
    
    const baseTime = 5; // base seconds for processing
    const timePerFile = 2; // seconds per file
    const totalEstimatedTime = baseTime + (filesToAnalyze.length * timePerFile);
    setEstimatedTime(totalEstimatedTime);
    console.log('Estimated processing time:', totalEstimatedTime, 'seconds');

    // Simulate processing steps
    const steps = ['Starting analysis', 'Extracting text', 'Analyzing keywords', 'Calculating matches'];
    let currentStep = 0;
    
    setProcessingStep(steps[0]);
    console.log('Processing step:', steps[0]);

    const stepInterval = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length;
      setProcessingStep(steps[currentStep]);
      console.log('Processing step:', steps[currentStep]);
      
      // When progress is high but not complete, stay in final processing step
      if (progress > 90) {
        console.log('Progress > 90%, finalizing');
        clearInterval(stepInterval);
        setProcessingStep('Finalizing results');
      }
    }, totalEstimatedTime * 250 / steps.length);

    return () => {
      console.log('Clearing step interval');
      clearInterval(stepInterval);
    };
  }, [analyzing, filesToAnalyze.length, progress]);
  
  // Handle weight change
  const handleWeightChange = (aspect: keyof AspectWeights, value: number) => {
    // Create a copy of current weights
    const newWeights = { ...weights };
    
    // Calculate the difference between old and new value
    const diff = value - newWeights[aspect];
    
    // Update the specified aspect with the new value
    newWeights[aspect] = value;
    
    // Distribute the difference proportionally among other aspects
    if (diff !== 0) {
      // Get sum of other weights
      const otherWeightsSum = Object.entries(newWeights)
        .filter(([key]) => key !== aspect)
        .reduce((sum, [, val]) => sum + val, 0);
      
      if (otherWeightsSum > 0) {
        // Calculate adjustment factor
        const adjustmentFactor = -diff / otherWeightsSum;
        
        // Adjust other weights proportionally
        Object.keys(newWeights).forEach(key => {
          if (key !== aspect) {
            const k = key as keyof AspectWeights;
            const adjustedWeight = Math.round(newWeights[k] * (1 + adjustmentFactor));
            newWeights[k] = Math.max(0, Math.min(100, adjustedWeight));
          }
        });
        
        // Ensure total is exactly 100%
        const newTotal = Object.values(newWeights).reduce((sum, val) => sum + val, 0);
        if (newTotal !== 100) {
          // Find the largest weight that's not the one we just changed
          const largestKey = Object.entries(newWeights)
            .filter(([key]) => key !== aspect)
            .sort(([, a], [, b]) => b - a)[0][0] as keyof AspectWeights;
          
          newWeights[largestKey] += (100 - newTotal);
        }
      }
    }
    
    setWeights(newWeights);
  };
  
  // Reset weights to default
  const resetWeights = () => {
    setWeights({
      skills: 40,
      experience: 30,
      achievements: 20,
      education: 5,
      culturalFit: 5
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Attempting to analyze files:', filesToAnalyze.length);
    
    if (filesToAnalyze.length === 0) {
      console.error('No files available for analysis');
      return;
    }
    
    if (!jobDescription) {
      console.error('No job description provided');
      return;
    }
    
    if (!folderId) {
      console.error('No folder ID available');
      return;
    }
    
    setAnalyzing(true);
    setProgress(0);
    setProcessingStep('Starting analysis');
    
    try {
      console.log('Starting analysis with folder ID:', folderId);
      
      // Use consistent userId - always use 'temp_user_id' for now
      // This ensures we use the same ID for loading and storing
      const userId = 'temp_user_id';
      console.log('Using consistent userId:', userId);
      
      // Set up a temporary timer to track progress while the analysis runs
      const isSingleFile = filesToAnalyze.length === 1;
      const totalTime = isSingleFile ? 3000 : Math.min(filesToAnalyze.length * 500, 5000);
      
      let currentProgress = 0;
      const progressTimer = setInterval(() => {
        currentProgress += 5;
        if (currentProgress >= 95) {
          clearInterval(progressTimer);
          currentProgress = 95;
        }
        setProgress(currentProgress);
      }, totalTime / 20);
      
      console.log('Storing job description for folder ID:', folderId, 'and user ID:', userId);
      console.log(`Job description content (first 30 chars): "${jobDescription.substring(0, 30)}..."`);
      
      // Store the job description in the database
      let jobDescriptionId = null;
      try {
        jobDescriptionId = await resumeAnalysisService.storeJobDescription(
          jobDescription,
          folderId,
          userId
        );
        console.log('Job description stored with ID:', jobDescriptionId);
      } catch (jobDescError) {
        console.error('Error storing job description:', jobDescError);
      }
      
      // Convert weights to the format expected by the API
      const weightDict = {
        skills: weights.skills / 100,
        experience: weights.experience / 100,
        achievements: weights.achievements / 100,
        education: weights.education / 100,
        culturalFit: weights.culturalFit / 100
      };
      
      // Run the actual analysis with full parameter set
      console.log('Running resume analysis with weights:', weightDict);
      
      let results: AnalysisResult[] = [];
      
      if (isSingleFile && filesToAnalyze.length > 0) {
        // Single file analysis
        try {
          const file = filesToAnalyze[0];
          console.log(`Analyzing single file: ${file.name}`);
          
          // Download the file
          const fileData = await fetch(file.url);
          const blob = await fileData.blob();
          const fileObj = new File([blob], file.name, { type: blob.type });
          
          console.log('File retrieved for analysis:', {
            name: file.name,
            type: blob.type,
            size: blob.size,
            url: file.url.substring(0, 50) + '...'
          });
          
          // Analyze the resume with all required parameters
          const result = await resumeAnalysisService.analyzeResume(
            fileObj,                // File object
            jobDescription,         // Job description
            folderId,               // Folder ID
            userId,                 // User ID
            file.id,                // File ID
            weightDict,             // Weights
            false                   // Use DistilBERT (false for faster processing)
          );
          
          console.log('Analysis result received:', {
            filename: result.filename,
            score: result.score,
            matchedKeywords: result.matchedKeywords?.length || 0,
            missingKeywords: result.missingKeywords?.length || 0,
            recommendations: result.recommendations?.length || 0,
            hasAspectScores: !!result.aspectScores,
            hasCandidateInfo: !!result.candidateInfo
          });
          
          // Add file metadata to the result
          result.file_id = file.id;
          result.fileUrl = file.url;
          result.folder_id = folderId;
          
          results = [result];
          console.log('Analysis complete for single file:', result);
        } catch (analyzeError) {
          console.error('Error analyzing single file:', analyzeError);
          setAnalyzing(false);
          alert(`Error analyzing resume: ${analyzeError instanceof Error ? analyzeError.message : String(analyzeError)}`);
          return;
        }
      } else {
        // Batch analysis
        try {
          const filesToProcess = filesToAnalyze.slice(0, 10); // Limit to 10 files to prevent overload
          console.log(`Analyzing batch of ${filesToProcess.length} files`);
          
          // Download all files
          const fileObjects: File[] = [];
          const fileIdMap: Record<string, string> = {};
          
          for (const file of filesToProcess) {
            try {
              const fileData = await fetch(file.url);
              const blob = await fileData.blob();
              const fileObj = new File([blob], file.name, { type: blob.type });
              fileObjects.push(fileObj);
              
              // Map file objects to IDs
              fileIdMap[file.name] = file.id;
              
              console.log(`Downloaded file ${file.name} (${blob.size} bytes)`);
            } catch (downloadError) {
              console.error(`Error downloading file ${file.name}:`, downloadError);
            }
          }
          
          // Analyze all resumes
          if (fileObjects.length > 0) {
            console.log('Starting batch analysis with', fileObjects.length, 'files');
            console.log('File ID map:', fileIdMap);
            
            try {
              const batchResults = await resumeAnalysisService.analyzeFolderContent(
                fileObjects,         // Files
                jobDescription,      // Job description
                folderId,            // Folder ID
                userId,              // User ID 
                weightDict           // Weights
              );
              
              console.log('Batch analysis results received:', batchResults.length);
              
              // Add file IDs to the results using the map
              results = batchResults.map((result) => {
                const filename = result.filename;
                const fileId = fileIdMap[filename];
                const fileObj = filesToProcess.find(f => f.id === fileId);
                
                return {
                  ...result,
                  file_id: fileId,
                  fileUrl: fileObj?.url,
                  folder_id: folderId
                };
              });
              
              console.log('Processed batch results:', results.length);
            } catch (analysisError) {
              console.error('Error during batch analysis:', analysisError);
              setAnalyzing(false);
              alert(`Error analyzing resumes: ${analysisError instanceof Error ? analysisError.message : String(analysisError)}`);
              return;
            }
          } else {
            console.error('No files could be downloaded for analysis');
            setAnalyzing(false);
            alert('No files could be downloaded for analysis. Please try again.');
            return;
          }
        } catch (batchError) {
          console.error('Error with batch analysis:', batchError);
          setAnalyzing(false);
          alert(`Error preparing batch analysis: ${batchError instanceof Error ? batchError.message : String(batchError)}`);
          return;
        }
      }
      
      // Clean up progress timer
      clearInterval(progressTimer);
      
      // Try to store analysis results if we have a job description ID
      if (jobDescriptionId) {
        try {
          console.log('Storing analysis results in database');
          
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const file = filesToAnalyze.find(f => f.id === result.file_id);
            
            if (!file || !result.file_id) {
              console.error(`Missing file or file_id for result ${i}`);
              continue;
            }
            
            try {
              // Create aspect scores from weights if not already provided
              const aspectScores = result.aspectScores || {
                skills: result.score * (weights.skills / 100),
                experience: result.score * (weights.experience / 100),
                achievements: result.score * (weights.achievements / 100),
                education: result.score * (weights.education / 100),
                culturalFit: result.score * (weights.culturalFit / 100)
              };
              
              // Use achievement bonus from result or default
              const achievementBonus = result.aspectScores ? 
                (result.aspectScores.achievements || 5.0) : 5.0;
              
              // Clean up undefined values in aspectScores to fix TypeScript error
              const cleanAspectScores: Record<string, number> = {};
              Object.entries(aspectScores).forEach(([key, value]) => {
                if (value !== undefined) {
                  cleanAspectScores[key] = typeof value === 'number' ? value : 0;
                }
              });
              
              await resumeAnalysisService.storeAnalysisResult(
                result.file_id,
                jobDescriptionId,
                result.score,
                result.matchedKeywords,
                result.missingKeywords,
                achievementBonus,
                cleanAspectScores,
                userId
              );
              console.log(`Stored analysis for file ${i+1}/${results.length}`);
            } catch (storeError) {
              console.error(`Failed to store analysis for file ${i+1}:`, storeError);
              // Continue with other files
            }
          }
        } catch (batchStoreError) {
          console.error('Error storing batch results:', batchStoreError);
          // Continue with local results
        }
      }
      
      // Always set progress to 100% when complete
      setProgress(100);
      console.log('Setting progress to 100%');
      
      // Store results in localStorage regardless of database success
      setTimeout(() => {
        try {
          console.log('Storing results in localStorage');
          
          // Save results to the folder-specific localStorage for immediate UI update
          if (folderId) {
            try {
              const folderAnalyzedFilesKey = `analyzed_files_${folderId}`;
              const fileIds = results
                .filter(r => r.file_id)
                .map(r => r.file_id) as string[];
              
              localStorage.setItem(folderAnalyzedFilesKey, JSON.stringify(fileIds));
              console.log(`Updated folder-specific analyzed files cache with ${fileIds.length} files`);
            } catch (cacheError) {
              console.error('Error updating folder-specific cache:', cacheError);
            }
          }
          
          // Load existing results if any
          const existingResultsStr = localStorage.getItem('resumeAnalysisResults');
          let existingResults: AnalysisResult[] = [];
          if (existingResultsStr) {
            try {
              existingResults = JSON.parse(existingResultsStr) as AnalysisResult[];
              console.log('Loaded existing results from localStorage:', existingResults.length);
            } catch (parseError) {
              console.error('Error parsing existing results:', parseError);
            }
          }
          
          // Create a map to easily update or add new results
          const resultsMap = new Map<string, AnalysisResult>();
          
          // Add existing results to the map (keeping only results from other folders)
          existingResults.forEach(result => {
            if (result.file_id) {
              // Add all results to the map, including from current folder
              // Results from current folder will be overwritten with new results
              resultsMap.set(result.file_id, result);
            }
          });
          
          // Add or update with new results, ensuring they have the folder_id
          results.forEach(result => {
            if (result.file_id) {
              // Ensure each result has the current folder_id
              result.folder_id = folderId;
              resultsMap.set(result.file_id, result);
            }
          });
          
          // Convert map back to array
          const combinedResults = Array.from(resultsMap.values());
          console.log('Combined results count:', combinedResults.length);
          console.log('Results by folder:', 
            combinedResults.reduce((acc, r) => {
              const fid = r.folder_id || 'unknown';
              acc[fid] = (acc[fid] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          );
          
          // Store the combined results
          localStorage.setItem('resumeAnalysisResults', JSON.stringify(combinedResults));
          
          // Store job description only for results page
          localStorage.setItem('jobDescription', jobDescription);
          localStorage.setItem('analysisWeights', JSON.stringify(weights));
          
          if (folderId) {
            localStorage.setItem('currentFolderId', folderId);
          }
          
          console.log('Navigating to results page');
          onClose();
          navigate('/resume-analysis-results');
        } catch (navError) {
          console.error('Error during navigation:', navError);
          alert('Error navigating to results page. Please try again.');
          setAnalyzing(false);
        }
      }, 500);
    } catch (error) {
      console.error('Error analyzing resumes:', error);
      setAnalyzing(false);
      alert('Error analyzing resumes: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  const resetForm = () => {
    setJobDescription('');
    setResults(null);
    setAnalyzing(false);
    setProgress(0);
    setProcessingStep('');
    
    // Reset to initial state, allowing user to analyze again
    if (folderFiles.length > 0) {
      setFilesToAnalyze(folderFiles);
      setIsBatchMode(folderFiles.length > 1);
    }
  };

  // Render weight adjustment section
  const renderWeightSettings = () => {
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Settings size={12} className="text-gray-600" />
            <h4 className="text-xs font-medium text-gray-700">Scoring Weights</h4>
          </div>
          <button 
            onClick={resetWeights}
            className="text-xs text-orange-600 hover:text-orange-800"
          >
            Reset
          </button>
        </div>

        <div className="space-y-2">
          <WeightSlider 
            label="Skills Match" 
            value={weights.skills} 
            onChange={(value) => handleWeightChange('skills', value)} 
          />
          <WeightSlider 
            label="Experience Relevance" 
            value={weights.experience} 
            onChange={(value) => handleWeightChange('experience', value)} 
          />
          <WeightSlider 
            label="Achievements/Impact" 
            value={weights.achievements} 
            onChange={(value) => handleWeightChange('achievements', value)} 
          />
          <WeightSlider 
            label="Education and Certifications" 
            value={weights.education} 
            onChange={(value) => handleWeightChange('education', value)} 
          />
          <WeightSlider 
            label="Cultural Fit/Soft Skills" 
            value={weights.culturalFit} 
            onChange={(value) => handleWeightChange('culturalFit', value)} 
          />
        </div>

        <div className="mt-2 text-xs text-gray-500">
          <p>Total weight: 100% (automatically balanced)</p>
        </div>
      </div>
    );
  };
  
  // Render resume analysis results
  const renderResumeAnalysis = () => {
    if (!results) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <div className="p-1.5 bg-orange-50 rounded">
            <FileText size={16} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-medium text-gray-900">Resume Analysis</h3>
                <p className="text-xs text-gray-500">{results.filename}</p>
              </div>
              <div className="px-2 py-0.5 bg-orange-50 rounded-full">
                <span className="text-orange-700 font-medium text-xs">Score: {results.score}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2.5">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Matched Keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {results.matchedKeywords.map((keyword, index) => (
                <span 
                  key={index} 
                  className="flex items-center px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded-md"
                >
                  <CheckCircle size={10} className="mr-1" />
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Missing Keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {results.missingKeywords.map((keyword, index) => (
                <span 
                  key={index} 
                  className="flex items-center px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded-md"
                >
                  <AlertTriangle size={10} className="mr-1" />
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Recommendations</h4>
            <div className="bg-orange-50 rounded-md p-2 space-y-1.5">
              {results.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start">
                  <Zap size={12} className="text-orange-500 mt-0.5 mr-1.5 flex-shrink-0" />
                  <p className="text-xs text-orange-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="pt-1 flex justify-end space-x-2">
          <button
            onClick={resetForm}
            className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            Check Another
          </button>
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-orange-500 text-white text-xs font-medium rounded-md hover:bg-orange-600 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  };
  
  // Render progress indicator
  const renderProgressIndicator = () => {
    if (!analyzing) return null;

    // Calculate remaining time, ensuring it doesn't jump too much
    const remainingTime = Math.max(0, Math.ceil(estimatedTime * (100 - progress) / 100));
    
    return (
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-orange-500" />
            <h3 className="text-sm font-medium text-gray-900">Processing Resumes</h3>
          </div>
          <div className="text-sm text-orange-500 font-medium">{Math.min(progress, 100)}%</div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${Math.min(progress, 100)}%` }} 
          />
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>{progress === 100 ? 'Finalizing results' : processingStep}</div>
          <div>Est. {progress === 100 ? '0s' : `${remainingTime}s`} remaining</div>
        </div>

        <p className="text-xs text-gray-600 mt-2">
          {isBatchMode 
            ? `Analyzing ${filesToAnalyze.length} resumes against the job description...` 
            : 'Analyzing resume against the job description...'}
        </p>
      </div>
    );
  };

  // Function to check API connection
  const checkApiConnection = async () => {
    resumeAnalysisService.resetConnectionError();
    const isApiAvailable = await resumeAnalysisService.checkApiStatus();
    return isApiAvailable;
  };

  const toggleMockData = () => {
    const newValue = !useMockData;
    setUseMockData(newValue);
    localStorage.setItem(USE_MOCK_DATA_KEY, String(newValue));
    console.log('Mock data mode set to:', newValue);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={analyzing ? undefined : onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[85vh] overflow-hidden">
        <div className={`flex items-center px-4 py-2 border-b border-gray-100 ${analyzing && isBatchMode ? 'justify-between' : 'justify-between'}`}>
          <h2 className="text-sm font-semibold text-gray-900">
            {isBatchMode ? 'Batch Resume ATS Checker' : 'Resume ATS Checker'}
          </h2>
          {!analyzing && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-50"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="p-3 overflow-y-auto max-h-[calc(85vh-48px)]">
          {analyzing ? (
            renderProgressIndicator()
          ) : results ? (
            renderResumeAnalysis()
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 rounded-full">
                    <Zap size={14} className="text-orange-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">ATS Checker</h3>
                </div>
                
                <div className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full">
                  {filesToAnalyze.length} {filesToAnalyze.length === 1 ? 'file' : 'files'} to analyze
                </div>
              </div>
              
              <p className="text-xs text-gray-600">
                Enter a job description to analyze {filesToAnalyze.length === 1 ? 'this resume' : 'these resumes'} against. 
              </p>
              
              {/* Debug toggle for mock data */}
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">API Connection:</span>
                  <button 
                    type="button"
                    onClick={checkApiConnection}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Check Status
                  </button>
                </div>
                
                <div 
                  className={`flex items-center gap-2 p-1 rounded ${useMockData ? 'bg-orange-100' : ''}`}
                  onClick={toggleMockData}
                >
                  <span className={`${useMockData ? 'text-orange-700 font-medium' : 'text-gray-600'}`}>
                    Use Mock Data:
                  </span>
                  <button 
                    type="button"
                    className="text-gray-500"
                  >
                    {useMockData ? 
                      <ToggleRight className="text-orange-500" size={18} /> : 
                      <ToggleLeft size={18} />
                    }
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  {loadingJobDescription ? (
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-md h-24 flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <Loader2 size={16} className="animate-spin text-orange-500" />
                        <span className="text-xs text-gray-600">Loading job description...</span>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      id="jobDescription"
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs focus:outline-none focus:border focus:border-orange-400 transition-colors duration-200 h-24 resize-y"
                      required
                    />
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowWeightSettings(!showWeightSettings)}
                  className="flex items-center text-xs text-gray-600 hover:text-orange-600 transition-colors"
                >
                  <Settings size={12} className="mr-1" />
                  {showWeightSettings ? 'Hide Scoring Weights' : 'Customize Scoring Weights'}
                  {showWeightSettings ? <ChevronUp size={12} className="ml-1" /> : <ChevronDown size={12} className="ml-1" />}
                </button>
                
                {showWeightSettings && renderWeightSettings()}
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={analyzing || loadingJobDescription || !jobDescription || filesToAnalyze.length === 0}
                    className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-md hover:bg-orange-600 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing ? 'Analyzing...' : 
                     loadingJobDescription ? 'Loading...' : 
                     `Analyze ${filesToAnalyze.length === 1 ? 'Resume' : `${filesToAnalyze.length} Resumes`}`}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ATSCheckerDialog; 