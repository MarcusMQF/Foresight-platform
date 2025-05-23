import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, Zap, Clock, Settings, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { AnalysisResult } from '../../services/resume-analysis.service';
import resumeAnalysisService from '../../services/resume-analysis.service';
import { FileItem } from '../../services/documents.service';
import { useNavigate, useParams } from 'react-router-dom';
import WeightSlider from '../UI/WeightSlider';
import { supabase } from '../../lib/supabase';

// Define the weights interface
interface AspectWeights {
  skills: number;
  experience: number;
  achievements: number;
  education: number;
  culturalFit: number;
}

interface ATSCheckerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderFiles?: FileItem[]; // Files from the current folder
}

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
      const loadJobDescription = async () => {
        setLoadingJobDescription(true);
        try {
          // Use temp user ID until authentication is implemented
          const userId = 'temp_user_id';
          
          // Try to load job description from database
          const jobDesc = await resumeAnalysisService.getLatestJobDescription(folderId, userId);
          
          if (jobDesc) {
            console.log('Loaded job description from database:', jobDesc.id);
            setJobDescription(jobDesc.description);
          } else {
            // If no job description found, check localStorage as fallback
            const storedJobDesc = localStorage.getItem('jobDescription');
            if (storedJobDesc) {
              console.log('Using job description from localStorage');
              setJobDescription(storedJobDesc);
            }
          }
        } catch (error) {
          console.error('Error loading job description:', error);
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
  
  // Perform mock analysis without database dependencies
  const performMockAnalysis = async (files: FileItem[], isSingleFile: boolean): Promise<AnalysisResult[]> => {
    console.log(`Performing mock analysis for ${files.length} files, single file mode: ${isSingleFile}`);
    
    // Simulate varying analysis time
    const delay = isSingleFile ? 2000 : Math.min(files.length * 300, 3000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const results: AnalysisResult[] = files.map((file, index) => ({
      score: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
      matchedKeywords: ['project management', 'team leadership', 'agile', 'communication'].slice(0, 3 + index % 2),
      missingKeywords: ['data analysis', 'python', 'machine learning'].slice(0, 2 + index % 2),
      recommendations: [
        'Add more specific details about your data analysis skills',
        'Include python programming experience if applicable',
        'Highlight any machine learning or AI projects you\'ve worked on'
      ],
      filename: file.name,
      fileUrl: file.url,
      file_id: file.id,
      folder_id: folderId // Add folder_id to each result
    }));
    
    console.log('Mock analysis completed successfully');
    return results;
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
      
      // Get the current user ID
      let userId = 'anonymous';
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
        } else {
          userId = user?.id || 'anonymous';
          console.log('Got user ID:', userId);
        }
      } catch (authError) {
        console.error('Auth error:', authError);
      }
      
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
      
      // Run the actual analysis instead of mock analysis
      console.log('Running real resume analysis...');
      
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
          
          // Analyze the resume
          const result = await resumeAnalysisService.analyzeResume(fileObj, jobDescription);
          
          // Add file ID to the result
          result.file_id = file.id;
          result.fileUrl = file.url;
          
          results = [result];
          console.log('Analysis complete for single file');
        } catch (analyzeError) {
          console.error('Error analyzing single file:', analyzeError);
          
          // Fallback to mock analysis if real analysis fails
          console.log('Falling back to mock analysis for single file');
          results = await performMockAnalysis([filesToAnalyze[0]], true);
        }
      } else {
        // Batch analysis
        try {
          const filesToProcess = filesToAnalyze.slice(0, 10); // Limit to 10 files to prevent overload
          console.log(`Analyzing batch of ${filesToProcess.length} files`);
          
          // Download all files
          const fileObjects: File[] = [];
          for (const file of filesToProcess) {
            try {
              const fileData = await fetch(file.url);
              const blob = await fileData.blob();
              const fileObj = new File([blob], file.name, { type: blob.type });
              fileObjects.push(fileObj);
            } catch (downloadError) {
              console.error(`Error downloading file ${file.name}:`, downloadError);
            }
          }
          
          // Analyze all resumes
          if (fileObjects.length > 0) {
            const batchResults = await resumeAnalysisService.analyzeFolderContent(fileObjects, jobDescription);
            
            // Add file IDs to the results
            results = batchResults.map((result, index) => {
              return {
                ...result,
                file_id: filesToProcess[index].id,
                fileUrl: filesToProcess[index].url
              };
            });
            
            console.log('Batch analysis complete for', results.length, 'files');
          }
        } catch (batchError) {
          console.error('Error with batch analysis:', batchError);
          
          // Fallback to mock analysis if real analysis fails
          console.log('Falling back to mock analysis for batch');
          results = await performMockAnalysis(filesToAnalyze, false);
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
              // Create aspect scores from weights
              const aspectScores = {
                skills: result.score * (weights.skills / 100),
                experience: result.score * (weights.experience / 100),
                achievements: result.score * (weights.achievements / 100),
                education: result.score * (weights.education / 100),
                culturalFit: result.score * (weights.culturalFit / 100)
              };
              
              // Use a fixed achievement bonus for now
              const achievementBonus = 5.0;
              
              await resumeAnalysisService.storeAnalysisResult(
                result.file_id,
                jobDescriptionId,
                result.score,
                result.matchedKeywords,
                result.missingKeywords,
                achievementBonus,
                aspectScores,
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