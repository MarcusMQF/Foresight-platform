import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, Zap, Settings, ChevronDown, ChevronUp, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { AnalysisResult, AspectWeights } from '../../services/resume-analysis.service';
import resumeAnalysisService from '../../services/resume-analysis.service';
import { FileItem } from '../../services/documents.service';
import { useNavigate } from 'react-router-dom';
import WeightSlider from '../UI/WeightSlider';
import { supabase } from '../../lib/supabase';
import CustomCheckbox from '../UI/CustomCheckbox';
import { validateWeights } from '../../utils/weights-validator';
import Dialog from '../UI/Dialog';

interface DocumentAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderFiles: FileItem[];
  folderId: string;
  selectedFileIds?: string[];
}

const DocumentAnalysisDialog: React.FC<DocumentAnalysisDialogProps> = ({ 
  isOpen, 
  onClose,
  folderFiles,
  folderId,
  selectedFileIds = []
}) => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [showWeightSettings, setShowWeightSettings] = useState(false);
  const [loadingJobDescription, setLoadingJobDescription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = 'temp_user_id'; // Default user ID for now
  const jobDescriptionRef = useRef<HTMLTextAreaElement>(null);
  
  // Initialize weights with default values
  const [weights, setWeights] = useState<AspectWeights>({
    skills: 2.0,
    experience: 1.5,
    achievements: 1.0,
    education: 0.8,
    culturalFit: 0.7  // We'll keep this in the state but not display it
  });
  
  // Load the last job description for this folder
  useEffect(() => {
    if (isOpen && folderId) {
      console.log('DocumentAnalysisDialog opened for folder:', folderId);
      
      setLoadingJobDescription(true);
      
      const loadJobDescription = async () => {
        try {
          const jobDescData = await resumeAnalysisService.getLatestJobDescription(folderId, userId);
          
          if (jobDescData && jobDescData.description) {
            console.log('Loaded existing job description');
            setJobDescription(jobDescData.description);
          } else {
            console.log('No existing job description found');
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
      setAnalyzing(false);
      setProgress(0);
      setProcessingStep('');
      setError(null);
      
      // Reset connection error flag in resume analysis service
      resumeAnalysisService.resetConnectionError();
      
      // Check if API is available
      resumeAnalysisService.checkApiStatus().then(isAvailable => {
        console.log('API connection check:', isAvailable ? 'available' : 'unavailable');
        if (!isAvailable) {
          setError('Could not connect to the AI analysis server. Please make sure it is running.');
        }
      });
      
      console.log('Files available for analysis:', folderFiles.length);
    }
  }, [isOpen, folderFiles]);

  // Update progress during analysis
  useEffect(() => {
    if (!analyzing) return;
    
    const totalEstimatedTime = estimateProcessingTime(selectedFileIds.length);
    setEstimatedTime(totalEstimatedTime);
    
    console.log(`Starting analysis with estimated time: ${totalEstimatedTime} seconds`);
    
    const steps = [
      'Starting analysis...',
      'Extracting text from resumes...',
      'Analyzing content...',
      'Identifying keywords...',
      'Comparing with job description...',
      'Calculating match scores...',
      'Generating recommendations...',
      'Finalizing results'
    ];
    
    // Set up a timer to update progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, totalEstimatedTime * 10);

    // Set up a timer to update processing step
    const stepInterval = setInterval(() => {
      setProcessingStep(prevStep => {
        const currentIndex = steps.indexOf(prevStep);
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < steps.length) {
          return steps[nextIndex];
        }
        
        return prevStep;
      });
    }, totalEstimatedTime * 250 / steps.length);

    // Initial step
    setProcessingStep(steps[0]);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [analyzing, selectedFileIds.length]);
  
  // Estimate processing time based on number of files
  const estimateProcessingTime = (fileCount: number): number => {
    // Base time for a single file is about 5 seconds
    const baseTime = 5;
    // Each additional file adds some time, but with diminishing returns
    const totalTime = baseTime + (Math.log(fileCount + 1) / Math.log(2)) * 5;
    return Math.max(5, Math.round(totalTime));
  };
  
  // Handle weight change
  const handleWeightChange = (aspect: keyof AspectWeights, value: number) => {
    setWeights(prev => ({
      ...prev,
      [aspect]: value
    }));
  };
  
  // Reset weights to default
  const resetWeights = () => {
    setWeights({
      skills: 2.0,
      experience: 1.5,
      achievements: 1.0,
      education: 0.8,
      culturalFit: 0.7
    });
  };
  
  // Start analysis
  const startAnalysis = async () => {
    // Get the selected files from folderFiles based on selectedFileIds
    const filesToAnalyze = folderFiles.filter(file => selectedFileIds.includes(file.id));
    
    if (filesToAnalyze.length === 0) {
      setError('Please select at least one file to analyze');
      return;
    }
    
    if (!jobDescription) {
      setError('Please enter a job description');
      return;
    }
    
    // Debug information
    console.log('Starting analysis with the following files:');
    filesToAnalyze.forEach(file => {
      console.log(`- ${file.name} (ID: ${file.id}, URL: ${file.url})`);
    });
    
    // Reset error
    setError(null);
    
    // Start analyzing
    setAnalyzing(true);
    setProgress(0);
    
    // Store job description in database first
    try {
      console.log('Storing job description...');
      const jobDescriptionId = await resumeAnalysisService.storeJobDescription(
        jobDescription, 
        folderId, 
        userId
      );
      
      if (!jobDescriptionId) {
        throw new Error('Failed to store job description');
      }
      
      console.log('Job description stored with ID:', jobDescriptionId);
      
      // Prepare files for analysis
      console.log(`Preparing ${filesToAnalyze.length} files for analysis...`);
      
      try {
        // Download files
        const downloadedFiles: { file: File, id: string }[] = [];
        
        for (let i = 0; i < filesToAnalyze.length; i++) {
          const fileItem = filesToAnalyze[i];
          
          try {
            // Get the file from Supabase Storage
            console.log(`Attempting to download file: ${fileItem.name}, url: ${fileItem.url}`);
            
            let fileData: Blob | null = null;
            
            // First try direct download
            try {
              // The url in FileItem already contains the full path: userId/folderId/fileId
              const { data, error } = await supabase
                .storage
                .from('documents')
                .download(fileItem.url);
              
              if (error) {
                console.error(`Direct download error for ${fileItem.name}:`, error);
                throw error;
              }
              
              if (!data) {
                throw new Error('No data received from direct download');
              }
              
              fileData = data;
              console.log(`Direct download successful for ${fileItem.name}`);
            } catch (directDownloadError) {
              console.log(`Trying fallback download method for ${fileItem.name}`);
              
              // Fallback: Try to get a signed URL and fetch the file
              try {
                const { data: urlData, error: urlError } = await supabase
                  .storage
                  .from('documents')
                  .createSignedUrl(fileItem.url, 60);
                  
                if (urlError || !urlData?.signedUrl) {
                  console.error(`Failed to get signed URL for ${fileItem.name}:`, urlError);
                  throw urlError || new Error('No signed URL received');
                }
                
                // Fetch the file using the signed URL
                const response = await fetch(urlData.signedUrl);
                if (!response.ok) {
                  throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
                }
                
                fileData = await response.blob();
                console.log(`Fallback download successful for ${fileItem.name}`);
              } catch (fallbackError) {
                console.error(`Fallback download failed for ${fileItem.name}:`, fallbackError);
                throw fallbackError;
              }
            }
            
            if (!fileData) {
              throw new Error('No file data available after all download attempts');
            }
            
            // Create a File object from the blob
            let mimeType = 'application/pdf';
            
            // Try to determine the MIME type from the file name if possible
            if (fileItem.name.toLowerCase().endsWith('.pdf')) {
              mimeType = 'application/pdf';
            } else if (fileItem.type) {
              mimeType = fileItem.type;
            }
            
            const file = new File([fileData], fileItem.name, { type: mimeType });
            downloadedFiles.push({ file, id: fileItem.id });
            console.log(`Successfully downloaded file ${i+1}/${filesToAnalyze.length}: ${fileItem.name} (${fileData.size} bytes)`);
          } catch (fileError) {
            console.error(`Error downloading file ${fileItem.name}:`, fileError);
            // Continue with other files
          }
        }
        
        console.log(`Successfully downloaded ${downloadedFiles.length} files for analysis`);
        
        if (downloadedFiles.length > 0) {
          try {
            // Prepare files for the analyzeFolderContent method
            const filesForAnalysis = downloadedFiles.map(df => df.file);
            
            console.log(`Sending ${filesForAnalysis.length} files for analysis`);
            
            // Perform batch analysis
            const results = await resumeAnalysisService.analyzeFolderContent(
              filesForAnalysis,
              jobDescription,
              folderId,
              userId,
              validateWeights(weights),
              false
            );
            
            console.log('Analysis complete. Storing results...');
            
            // Store each result in the database and associate with file IDs
            for (let i = 0; i < results.length; i++) {
              const result = results[i];
              const downloadedFile = downloadedFiles[i];
              
              if (!downloadedFile) continue;
              
              // Attach file ID to the result
              result.file_id = downloadedFile.id;
              
              try {
                // Extract aspect scores safely
                const aspectScores = result.aspectScores || {};
                
                // Get achievement bonus from result or default
                const achievementBonus = result.aspectScores ? 
                  (result.aspectScores.achievements || 1.0) : 1.0;
                
                // Clean up undefined values in aspectScores
                const cleanAspectScores: Record<string, number> = {};
                Object.entries(aspectScores).forEach(([key, value]) => {
                  if (value !== undefined) {
                    cleanAspectScores[key] = typeof value === 'number' ? value : 0;
                  }
                });
                
                await resumeAnalysisService.storeAnalysisResult(
                  downloadedFile.id,
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
            
            // Update folder-specific localStorage for immediate UI update
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
            
            // Set progress to 100%
            setProgress(100);
            
            // Navigate to results page
            setTimeout(() => {
              console.log('Navigating to results page...');
              navigate(`/folder/${folderId}/analysis-results`);
              onClose();
            }, 1000);
            
          } catch (analysisError) {
            console.error('Error during batch analysis:', analysisError);
            setAnalyzing(false);
            setError(`Error analyzing resumes: ${analysisError instanceof Error ? analysisError.message : String(analysisError)}`);
          }
        } else {
          console.error('No files could be downloaded for analysis');
          setAnalyzing(false);
          setError('No files could be downloaded for analysis. Please try again.');
        }
      } catch (batchError) {
        console.error('Error with batch analysis:', batchError);
        console.error('Stack trace:', batchError instanceof Error ? batchError.stack : 'No stack trace available');
        setAnalyzing(false);
        setError(`Error preparing batch analysis: ${batchError instanceof Error ? batchError.message : String(batchError)}`);
      }
    } catch (jobDescError) {
      console.error('Error storing job description:', jobDescError);
      setAnalyzing(false);
      setError(`Error storing job description: ${jobDescError instanceof Error ? jobDescError.message : String(jobDescError)}`);
    }
  };
  
  // Cancel dialog
  const cancelDialog = () => {
    if (analyzing) {
      // Confirm before closing if analysis is in progress
      if (window.confirm('Analysis is in progress. Are you sure you want to cancel?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };
  
  // Create file selection subtitle
  const fileSelectionSubtitle = (
    <div className="flex items-center">
      <FileText size={10} className="mr-1 text-primary-500" />
      <span>{selectedFileIds.length} file{selectedFileIds.length !== 1 ? 's' : ''} selected</span>
    </div>
  );
  
  const dialogContent = (
    <>
      {analyzing ? (
        // Progress view
        <div className="space-y-3">
          <div className="text-center py-4">
            <div className="mb-3">
              <div className="relative w-12 h-12 mx-auto">
                <Loader2 size={48} className="animate-spin mx-auto text-primary-500 opacity-25" />
                <div className="absolute inset-0 flex items-center justify-center text-primary-600 font-medium text-xs">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
            <h3 className="text-xs font-medium text-gray-900 mb-1">
              {processingStep || 'Analyzing resumes...'}
            </h3>
            <p className="text-xs text-gray-500">
              Please don't close this window.
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-700">
              <span>Progress</span>
              <span>Est: {Math.max(0, Math.ceil(estimatedTime * (100 - progress) / 100))}s</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary-500 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        // Input view
        <div className="space-y-3">
          {/* Job Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <div className="p-0.5">
              <textarea
                ref={jobDescriptionRef}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-40 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 focus:border-[1px]"
                disabled={loadingJobDescription}
              />
            </div>
            {loadingJobDescription && (
              <div className="text-xs text-gray-500 mt-1 flex items-center">
                <Loader2 size={10} className="animate-spin mr-1" />
                Loading saved job description...
              </div>
            )}
          </div>
          
          {/* Weight Settings */}
          <div className="bg-gray-50 rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowWeightSettings(!showWeightSettings)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <Settings size={14} className="mr-2 text-primary-500" />
                <span>Customize Analysis Weights</span>
              </div>
              {showWeightSettings ? 
                <ChevronUp size={14} className="text-gray-500" /> : 
                <ChevronDown size={14} className="text-gray-500" />
              }
            </button>
            
            {showWeightSettings && (
              <div className="px-3 py-2 border-t border-gray-200 bg-white">
                <p className="text-xs text-gray-600 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-primary-500 rounded-full mr-1.5"></span>
                  Adjust the importance of each aspect in the analysis
                </p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="bg-white rounded-md p-2 shadow-sm border border-gray-100">
                      <WeightSlider
                        label="skills"
                        value={weights.skills}
                        onChange={(newValue) => handleWeightChange('skills', newValue)}
                        min={0}
                        max={5}
                      />
                    </div>
                    <div className="bg-white rounded-md p-2 shadow-sm border border-gray-100">
                      <WeightSlider
                        label="experience"
                        value={weights.experience}
                        onChange={(newValue) => handleWeightChange('experience', newValue)}
                        min={0}
                        max={5}
                      />
                    </div>
                    <div className="bg-white rounded-md p-2 shadow-sm border border-gray-100">
                      <WeightSlider
                        label="achievements"
                        value={weights.achievements}
                        onChange={(newValue) => handleWeightChange('achievements', newValue)}
                        min={0}
                        max={5}
                      />
                    </div>
                    <div className="bg-white rounded-md p-2 shadow-sm border border-gray-100">
                      <WeightSlider
                        label="education"
                        value={weights.education}
                        onChange={(newValue) => handleWeightChange('education', newValue)}
                        min={0}
                        max={5}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-3">
                  <button
                    onClick={resetWeights}
                    className="px-2.5 py-2 text-xs bg-gray-50 hover:bg-gray-100 text-primary-600 hover:text-primary-800 rounded border border-gray-200 flex items-center transition-colors"
                  >
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded text-xs">
              <div className="flex">
                <AlertTriangle size={12} className="mr-1 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
        <button
          onClick={cancelDialog}
          className="px-2.5 py-2 text-xs font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-200 rounded"
          disabled={analyzing && progress > 80}
        >
          {analyzing ? 'Cancel' : 'Close'}
        </button>
        
        {!analyzing && (
          <button
            onClick={startAnalysis}
            disabled={selectedFileIds.length === 0 || !jobDescription || loadingJobDescription}
            className={`px-3 py-2 rounded text-xs font-medium text-white flex items-center 
              ${selectedFileIds.length === 0 || !jobDescription || loadingJobDescription
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600'
              }`}
          >
            <Zap size={12} className="mr-1.5" />
            Analyze
          </button>
        )}
      </div>
    </>
  );
  
  // Focus job description when dialog opens and not loading
  useEffect(() => {
    if (isOpen && !loadingJobDescription && jobDescriptionRef.current) {
      // Small timeout to ensure the dialog is fully rendered
      const timer = setTimeout(() => {
        jobDescriptionRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, loadingJobDescription]);
  
  return (
    <Dialog
      isOpen={isOpen}
      onClose={cancelDialog}
      title="ATS Resume Analysis"
      subtitle={fileSelectionSubtitle}
      maxWidth="xl"
      closeOnOutsideClick={false}
      blurBackdrop={true}
    >
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        {dialogContent}
      </div>
    </Dialog>
  );
};

export default DocumentAnalysisDialog; 