import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, FileText, Zap, ArrowLeft, Maximize, Minimize, RefreshCw, Download, UserPlus } from 'lucide-react';
import { AnalysisResult } from '../services/resume-analysis.service';
import { DocumentsService } from '../services/documents.service';
import { supabase } from '../lib/supabase';
import SimplePDFViewer from '../components/SimplePDFViewer';
import resumeAnalysisService from '../services/resume-analysis.service';
import LottieAnimation from '../components/UI/LottieAnimation';
import { LOADER_ANIMATION } from '../utils/animationPreloader';
import HRAssessment from '../components/Analysis/HRAssessment';
import MatchScoreBadge from '../components/UI/MatchScoreBadge';
import RadarChart from '../components/RadarChart';
import RadarChartLegend from '../components/RadarChartLegend';
import { createScoreCategories } from '../utils/scoreUtils';

// Log current component version
console.log('ResumeDetails component loaded with SimplePDFViewer');

const ResumeDetails: React.FC = () => {
  const navigate = useNavigate();
  const { resultId } = useParams<{ resultId: string }>();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [] = useState(1.2);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHrDataLoading, setIsHrDataLoading] = useState(false);
  const [hrDataError, setHrDataError] = useState<string | null>(null);

  // Add a retry mechanism for PDF loading
  const [loadAttempts, setLoadAttempts] = useState(0);
  const maxLoadAttempts = 3;

  // For document service
  const documentsService = new DocumentsService();

  // Cleanup function for blob URLs
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when component unmounts
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        console.log('Cleaning up blob URL on unmount:', pdfUrl);
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    // Explicitly disable mock data in localStorage
    localStorage.removeItem('USE_MOCK_DATA');
    
    // Load result from database only, not localStorage
    const loadResult = async () => {
      try {
        console.log('Loading result for ID:', resultId);
        
        if (!resultId) {
          console.error('No result ID provided');
          navigate('/resume-analysis-results');
          return;
        }
        
        // Get current user ID
        let userId = 'temp_user_id';
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (!userError && user) {
            userId = user.id;
          }
        } catch (authError) {
          console.error('Auth error:', authError);
        }
        
        // Get current folder ID from localStorage
        const folderId = localStorage.getItem('currentFolderId');
        
        if (!folderId) {
          console.warn('No folder ID found in localStorage, will try to find file anyway');
        }
        
        console.log('Looking up file in database with name:', resultId);
        
        // First, find the file ID by filename
        let query = supabase
          .from('files')
          .select('id, name, url')
          .eq('name', resultId)
          .limit(1);
          
        // Add folder filter if we have a folder ID
        if (folderId) {
          query = query.eq('folderId', folderId);
        }
        
        const { data: files, error: filesError } = await query;
        
        if (filesError) {
          console.error('Error fetching file:', filesError);
          setError('Could not find the file in the database. Please try again.');
          setIsLoading(false);
          return;
        }
        
        if (!files || files.length === 0) {
          console.error('File not found in database:', resultId);
          
          // Try a more general search without folder constraint
          if (folderId) {
            console.log('Trying to find file without folder constraint');
            const { data: allFiles, error: allFilesError } = await supabase
              .from('files')
              .select('id, name, url')
              .eq('name', resultId)
              .limit(1);
              
            if (allFilesError) {
              console.error('Error in general file search:', allFilesError);
              setError('Could not find the file in the database. Please try again.');
              setIsLoading(false);
              return;
            }
            
            if (!allFiles || allFiles.length === 0) {
              setError(`File "${resultId}" not found in any folder. Please return to results.`);
              setIsLoading(false);
              return;
            }
            
            // We found the file in another folder
            console.log('Found file in another folder:', allFiles[0]);
            files.push(allFiles[0]);
          } else {
            setError(`File "${resultId}" not found. Please return to results.`);
            setIsLoading(false);
            return;
          }
        }
        
        console.log('Found file in database:', files[0]);
        const fileId = files[0].id;
        
        // Now get the analysis result for this file
        let analysisQuery = supabase
          .from('analysis_results')
          .select('*')
          .eq('file_id', fileId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        // Add user filter if we have a user ID
        if (userId && userId !== 'temp_user_id') {
          analysisQuery = analysisQuery.eq('userId', userId);
        }
        
        const { data: analysisData, error: analysisError } = await analysisQuery;
        
        if (analysisError) {
          console.error('Error fetching analysis result:', analysisError);
          setError('Could not retrieve analysis results. Please try again.');
          setIsLoading(false);
          return;
        }
        
        if (!analysisData || analysisData.length === 0) {
          console.error('Analysis result not found for file:', resultId);
          
          // Try without user constraint if we used one
          if (userId && userId !== 'temp_user_id') {
            console.log('Trying to find analysis without user constraint');
            const { data: anyAnalysis, error: anyAnalysisError } = await supabase
              .from('analysis_results')
              .select('*')
              .eq('file_id', fileId)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (anyAnalysisError) {
              console.error('Error in general analysis search:', anyAnalysisError);
              setError('No analysis found for this file. Please return to results.');
              setIsLoading(false);
              return;
            }
            
            if (!anyAnalysis || anyAnalysis.length === 0) {
              setError(`No analysis found for "${resultId}". Please analyze this file first.`);
              setIsLoading(false);
              return;
            }
            
            // We found analysis from another user
            console.log('Found analysis from another user:', anyAnalysis[0]);
            analysisData.push(anyAnalysis[0]);
          } else {
            setError(`No analysis found for "${resultId}". Please analyze this file first.`);
            setIsLoading(false);
            return;
          }
        }
        
        console.log('Found analysis result in database:', analysisData[0]);
        
        // Parse strengths and weaknesses if they're stored as strings
        let strengths = analysisData[0].strengths;
        let weaknesses = analysisData[0].weaknesses;
        
        try {
          if (typeof strengths === 'string') {
            strengths = JSON.parse(strengths);
          }
        } catch (e) {
          console.error('Error parsing strengths:', e);
          strengths = [];
        }
        
        try {
          if (typeof weaknesses === 'string') {
            weaknesses = JSON.parse(weaknesses);
          }
        } catch (e) {
          console.error('Error parsing weaknesses:', e);
          weaknesses = [];
        }
        
        // Parse aspect scores if stored as string
        let aspectScores = {};
        try {
          if (analysisData[0].aspect_scores) {
            if (typeof analysisData[0].aspect_scores === 'string') {
              aspectScores = JSON.parse(analysisData[0].aspect_scores);
            } else {
              aspectScores = analysisData[0].aspect_scores;
            }
          }
        } catch (e) {
          console.error('Error parsing aspect scores:', e);
        }
        
        // Parse candidate info if stored as string
        let candidateInfo: Record<string, any> = {};
        try {
          if (analysisData[0].candidate_info) {
            // Log raw candidate_info from database
            console.log('Raw candidate_info from database:', analysisData[0].candidate_info);
            
            // Parse string or use object directly
            if (typeof analysisData[0].candidate_info === 'string') {
              try {
                candidateInfo = JSON.parse(analysisData[0].candidate_info);
                console.log('Successfully parsed candidate_info string');
              } catch (parseError) {
                console.error('Failed to parse candidate_info string:', parseError);
                // Try to handle as string content
                candidateInfo = { 
                  name: 'Parsed Name', 
                  email: 'parsed@example.com',
                  raw: analysisData[0].candidate_info
                };
              }
            } else {
              // Use object directly
              candidateInfo = analysisData[0].candidate_info;
              console.log('Using candidate_info object directly');
            }
            
            // Log the candidate info we found in the database for debugging
            console.log('Found candidate info in database:', candidateInfo);
            
            // Ensure we have valid candidate info format
            if (typeof candidateInfo !== 'object' || candidateInfo === null) {
              console.log('Invalid candidateInfo format, resetting to empty object');
              candidateInfo = {};
            }
            
            // Validate that it has at least name and email properties
            if (!candidateInfo.name && !candidateInfo.email) {
              // Check if properties might be nested (this happens with some DB serialization)
              const keys = Object.keys(candidateInfo);
              if (keys.length > 0 && typeof candidateInfo[keys[0]] === 'object') {
                // Try to extract nested data
                const nestedData = candidateInfo[keys[0]] as Record<string, any>;
                console.log('Found nested candidate data:', nestedData);
                candidateInfo = nestedData;
              }
            }
            
            // Check for education as a special case since it might contain important details
            if (candidateInfo.education) {
              console.log('Found education info:', candidateInfo.education);
            }
            
            // Check for location info
            if (candidateInfo.location) {
              console.log('Found location info:', candidateInfo.location);
            }
            
            // Save candidate info fields directly in the object
            candidateInfo = {
              name: candidateInfo.name || '',
              email: candidateInfo.email || ''
            };
            
            console.log('Final candidate info object:', candidateInfo);
          } else {
            console.log('No candidate_info found in database record');
          }
        } catch (e) {
          console.error('Error parsing candidate info:', e);
          candidateInfo = {};
        }
        
        // Parse HR data if stored as string or object
        let hrAnalysis = {};
        let hrAssessment = {};
        let hrRecommendations: string[] = [];
        
        try {
          if (analysisData[0].hr_data) {
            let hrData;
            if (typeof analysisData[0].hr_data === 'string') {
              hrData = JSON.parse(analysisData[0].hr_data);
            } else {
              hrData = analysisData[0].hr_data;
            }
            
            if (hrData) {
              hrAnalysis = hrData.hrAnalysis || {};
              hrAssessment = hrData.hrAssessment || {};
              hrRecommendations = hrData.hrRecommendations || [];
              
              console.log('Found HR data in database:', {
                hasAnalysis: Object.keys(hrAnalysis).length > 0,
                hasAssessment: Object.keys(hrAssessment).length > 0,
                recommendationsCount: hrRecommendations.length
              });
            }
          }
        } catch (e) {
          console.error('Error parsing HR data:', e);
        }
        
        // Transform database result to match our AnalysisResult interface
        const selectedResult: AnalysisResult = {
          id: analysisData[0].id,
          file_id: fileId,
          filename: resultId,
          fileUrl: files[0].url,
          score: analysisData[0].match_score,
          matchedKeywords: Array.isArray(strengths) ? strengths : [],
          missingKeywords: Array.isArray(weaknesses) ? weaknesses : [],
          recommendations: [], // We don't store recommendations in the database yet
          analyzed_at: analysisData[0].created_at,
          aspectScores: aspectScores,
          candidateInfo: candidateInfo && Object.keys(candidateInfo).length > 0 ? candidateInfo : {},
          hrAnalysis: hrAnalysis,
          hrAssessment: hrAssessment,
          hrRecommendations: hrRecommendations
        };
        
        // Debug log to check if candidate info is present
        console.log('Created selectedResult with candidateInfo:', selectedResult.candidateInfo);
        
        // Generate HR data if not available (silently, without requiring user action)
        if ((!selectedResult.hrAnalysis || Object.keys(selectedResult.hrAnalysis).length === 0) ||
            (!selectedResult.hrAssessment || Object.keys(selectedResult.hrAssessment).length === 0) ||
            (!selectedResult.hrRecommendations || selectedResult.hrRecommendations.length === 0)) {
          
          console.log('No HR data found, generating it automatically');
          setIsHrDataLoading(true);
          
          try {
            // Use the service to generate HR data
            const analysisService = resumeAnalysisService as any;
            if (typeof analysisService.generateHrData === 'function') {
              const hrData = analysisService.generateHrData(
                selectedResult.score,
                selectedResult.matchedKeywords,
                selectedResult.missingKeywords,
                selectedResult.aspectScores || {}
              );
              
              // Update the result with HR data
              selectedResult.hrAnalysis = hrData.hrAnalysis;
              selectedResult.hrAssessment = hrData.hrAssessment;
              selectedResult.hrRecommendations = hrData.hrRecommendations;
              
              // Store the HR data in the database
              try {
                await supabase
                  .from('analysis_results')
                  .update({
                    hr_data: hrData
                  })
                  .eq('id', selectedResult.id);
                  
                console.log('Automatically generated and stored HR data');
              } catch (storeError) {
                console.error('Error storing generated HR data:', storeError);
              }
            }
          } catch (hrError) {
            console.error('Error automatically generating HR data:', hrError);
          } finally {
            setIsHrDataLoading(false);
          }
        }
        
        // Handle candidate info that was loaded from the database
        if (selectedResult.candidateInfo && Object.keys(selectedResult.candidateInfo).length > 0) {
          // Log existing candidate info
          console.log('Using existing candidate info from database:', selectedResult.candidateInfo);
          
          // Keep the exact values from the database without modification
          console.log('Preserving exact candidate info values from database');
        } else {
          // No candidate info found - leave it empty
          console.log('No candidate info found in database - not generating any fallback');
          selectedResult.candidateInfo = {};
        }
        
        console.log('Setting result:', selectedResult);
        setResult(selectedResult);
        setLoadAttempts(0); // Reset load attempts
        fetchPdfUrl(selectedResult);
      } catch (error) {
        console.error('Error loading result:', error);
        setError('Failed to load resume details. Please try again.');
        setIsLoading(false);
      }
    };

    loadResult();
  }, [navigate, resultId]);

  useEffect(() => {
    if (error && loadAttempts < maxLoadAttempts) {
      // If we have an error and haven't exceeded max attempts, try again
      const timer = setTimeout(() => {
        console.log(`Retrying PDF load, attempt ${loadAttempts + 1} of ${maxLoadAttempts}`);
        setLoadAttempts(prev => prev + 1);
        // If we have a result, try fetching the PDF again
        if (result) {
          fetchPdfUrl(result);
        }
      }, 2000); // Wait 2 seconds before retrying
      
      return () => clearTimeout(timer);
    }
  }, [error, loadAttempts, result, maxLoadAttempts]);

  // Fetch the PDF URL for the selected resume
  const fetchPdfUrl = async (selectedResult: AnalysisResult) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching PDF for result:', selectedResult.filename);
      
      // If the result already has a fileUrl, use it directly
      if (selectedResult.fileUrl) {
        try {
          console.log('Getting file from storage URL with retry mechanism:', selectedResult.fileUrl);
          // Use the new retry method for more reliability
          const blobUrl = await documentsService.getFileAsBlobWithRetry(
            selectedResult.fileUrl,
            maxLoadAttempts - loadAttempts // Adjust max retries based on current attempts
          );
          console.log('Got blob URL for PDF:', blobUrl);
          
          setPdfUrl(blobUrl);
          // Add a small delay before hiding the loading indicator
          // This gives the PDF time to start rendering in the background
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
          return;
        } catch (error) {
          console.error('Error getting blob URL from fileUrl with retry:', error);
          // Don't set error yet, try the fallback method
        }
      }
      
      // Fallback: Search for the file in the database by name
      console.log('Searching for file in database by name:', selectedResult.filename);
      const { data: files, error: fetchError } = await supabase
        .from('files')
        .select('url, name')
        .eq('name', selectedResult.filename)
        .limit(1);
      
      if (fetchError) {
        console.error('Error fetching file info from database:', fetchError);
        throw fetchError;
      }
      
      if (files && files.length > 0) {
        console.log('Found file in database:', files[0]);
        try {
          // Get a blob URL for the file with retry mechanism
          const blobUrl = await documentsService.getFileAsBlobWithRetry(
            files[0].url,
            maxLoadAttempts - loadAttempts // Adjust max retries based on current attempts
          );
          console.log('Created blob URL for PDF:', blobUrl);
          
          setPdfUrl(blobUrl);
          // Add a small delay before hiding the loading indicator
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        } catch (urlError) {
          console.error('Error getting blob URL for found file:', urlError);
          setError('Failed to generate a viewable URL for the PDF file.');
          setIsLoading(false);
        }
      } else {
        // No file found in the database
        console.error('File not found in database:', selectedResult.filename);
        setError(`Couldn't find the PDF file "${selectedResult.filename}" in storage.`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchPdfUrl:', error);
      setError('Failed to load the PDF file. Please try again.');
      setIsLoading(false);
    }
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Return to results
  const backToResults = () => {
    // Make sure we preserve the folder ID when navigating back
    const storedFolderId = localStorage.getItem('currentFolderId');
    if (storedFolderId) {
      navigate(`/folder/${storedFolderId}/analysis-results`);
    } else {
      navigate('/resume-analysis-results');
    }
  };

  // Add a function to navigate directly back to files
  const backToFiles = () => {
    // Get folder ID from localStorage
    const storedFolderId = localStorage.getItem('currentFolderId');
    if (storedFolderId) {
      navigate(`/documents/${storedFolderId}`);
    } else {
      // Fallback to documents root if no folder ID is available
      navigate('/documents');
    }
  };

  // Add a retry button for the PDF viewer
  const handleRetry = () => {
    if (result) {
      setError(null);
      setIsLoading(true);
      setLoadAttempts(loadAttempts + 1);
      console.log(`Manual retry initiated, attempt ${loadAttempts + 1} of ${maxLoadAttempts}`);
      fetchPdfUrl(result);
    }
  };

  // Handle PDF viewer errors
  const handlePdfError = (errorMessage: string) => {
    console.error('PDF viewer reported error:', errorMessage);
    setError(errorMessage);
    
    // If we haven't reached max attempts, try again automatically
    if (loadAttempts < maxLoadAttempts && result) {
      const timer = setTimeout(() => {
        console.log(`Auto-retrying after PDF viewer error, attempt ${loadAttempts + 1} of ${maxLoadAttempts}`);
        setLoadAttempts(prev => prev + 1);
        fetchPdfUrl(result);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  };

  // Function to check if HR data exists
  const hasHrData = () => {
    if (!result) return false;
    
    return (
      result.hrAnalysis && 
      Object.keys(result.hrAnalysis || {}).length > 0 && 
      result.hrAssessment && 
      Object.keys(result.hrAssessment || {}).length > 0 && 
      result.hrRecommendations && 
      result.hrRecommendations.length > 0
    );
  };

  // Function to generate HR data
  const generateHrData = async () => {
    if (!result || !result.id) return;

    setIsHrDataLoading(true);
    setHrDataError(null);
    
    try {
      // Use the resumeAnalysisService to generate HR data
      const analysisService = resumeAnalysisService as any;
      if (typeof analysisService.generateHrData !== 'function') {
        throw new Error('generateHrData method not available');
      }
      
      // Generate HR data based on existing analysis
      const hrData = analysisService.generateHrData(
        result.score,
        result.matchedKeywords,
        result.missingKeywords,
        result.aspectScores || {}
      );
      
      // Update the result with HR data
      const updatedResult = {
        ...result,
        hrAnalysis: hrData.hrAnalysis,
        hrAssessment: hrData.hrAssessment,
        hrRecommendations: hrData.hrRecommendations
      };
      
      // Update the state immediately for UI
      setResult(updatedResult);
      
      // Store HR data in database
      const { error } = await supabase
        .from('analysis_results')
        .update({
          hr_data: hrData
        })
        .eq('id', result.id);
      
      if (error) throw error;
      
      console.log('Successfully generated and stored HR data');
    } catch (error) {
      console.error('Error generating HR data:', error);
      setHrDataError('Failed to generate HR assessment data');
    } finally {
      setIsHrDataLoading(false);
    }
  };

  // Add effect to log candidate info when result changes
  useEffect(() => {
    if (result?.candidateInfo) {
      // Log outside of JSX render
      console.log('Current candidate info:', result.candidateInfo);
    }
  }, [result]);

  if (!result) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="-mt-20">
          <LottieAnimation 
            animationUrl={LOADER_ANIMATION} 
            width={100} 
            height={100} 
            className="opacity-75" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center mb-3">
        <button
          onClick={backToResults}
          className="flex items-center text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Results
        </button>
      </div>

      <div className="flex h-[calc(100vh-150px)] gap-6">
        {/* Left Panel - Analysis */}
        <div className="w-1/3 overflow-auto bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-50 rounded">
                <FileText size={18} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Resume Analysis</h3>
                    <p className="text-xs text-gray-500">{result.filename}</p>
                  </div>
                  <div>
                    <MatchScoreBadge score={result.score} size="md" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Matched Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {result.matchedKeywords.map((keyword, index) => (
                    <span 
                      key={index} 
                      className="flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded"
                    >
                      <CheckCircle size={12} className="mr-1" />
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Missing Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((keyword, index) => (
                    <span 
                      key={index} 
                      className="flex items-center px-2 py-1 bg-red-50 text-red-700 text-xs rounded"
                    >
                      <AlertTriangle size={12} className="mr-1" />
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Only show recommendations section when there are recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Recommendations</h4>
                  <div className="bg-orange-50 rounded p-3 space-y-2">
                    {result.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start">
                        <Zap size={14} className="text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-xs text-orange-800">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {result.aspectScores && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Score Breakdown</h4>
                <div className="bg-transparent pb-1 px-1 rounded-md">
                  {(() => {
                    // Check if aspectScores exists before trying to use it
                    if (!result.aspectScores) {
                      return <div className="text-xs text-gray-500 text-center py-2">No score data available</div>;
                    }
                    
                    const scoreData = createScoreCategories(
                      // Transform the aspectScores object to ensure all values are in the same scale
                      Object.fromEntries(
                        Object.entries(result.aspectScores || {})
                          .filter(([_, score]) => score !== 0 && score !== undefined)
                          .map(([aspect, score]) => {
                            // Format aspect name (convert camelCase to Title Case)
                            const formattedAspect = aspect
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, str => str.toUpperCase());
                            
                            // Scale score if needed (some APIs return 0-1 scale)
                            let scoreValue = typeof score === 'number' ? score : 
                                        typeof score === 'string' ? parseFloat(score) : 0;
                            
                            // If score is in 0-1 range, scale to 0-10 for display
                            if (scoreValue > 0 && scoreValue < 1) {
                              scoreValue = scoreValue * 10;
                            }
                            
                            return [formattedAspect, scoreValue];
                          })
                      )
                    );

                    const colorScheme = { 
                      borderColor: 'rgb(249, 115, 22)', 
                      backgroundColor: 'rgba(249, 115, 22, 0.2)' 
                    };

                    return (
                      <div className="flex flex-col">
                        <div className="flex justify-center items-center mb-2">
                          <div className="rounded-lg p-0">
                            <RadarChart 
                              data={scoreData}
                              maxValue={100}
                              colorScheme={colorScheme}
                              compact={true}
                            />
                          </div>
                        </div>
                        <RadarChartLegend 
                          data={scoreData} 
                          maxValue={100}
                          colorScheme={colorScheme}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* File Metadata Section */}
            {result.metadata && Object.keys(result.metadata).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">File Details</h4>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-md text-xs">
                  {result.metadata.file_size_mb && (
                    <>
                      <span className="text-gray-600">File Size:</span>
                      <span className="text-gray-800">{result.metadata.file_size_mb.toFixed(2)} MB</span>
                    </>
                  )}
                  {result.metadata.pages && (
                    <>
                      <span className="text-gray-600">Pages:</span>
                      <span className="text-gray-800">{result.metadata.pages}</span>
                    </>
                  )}
                  {result.metadata.text_length && (
                    <>
                      <span className="text-gray-600">Text Length:</span>
                      <span className="text-gray-800">{result.metadata.text_length.toLocaleString()} characters</span>
                    </>
                  )}
                  {result.analyzed_at && (
                    <>
                      <span className="text-gray-600">Analyzed:</span>
                      <span className="text-gray-800">{new Date(result.analyzed_at).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Candidate Information Section */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Candidate Information</h4>
              <div className="bg-gray-50 px-2 pt-2 pb-1 rounded-md">
                {result.candidateInfo && Object.keys(result.candidateInfo).length > 0 ? (
                  <div className="mb-2">
                    {/* Show name if available */}
                    {result.candidateInfo.name ? (
                      <div className="flex items-center text-xs mb-1">
                        <span className="text-gray-600 font-medium w-20">Name:</span>
                        <span className="text-gray-800">{result.candidateInfo.name}</span>
                      </div>
                    ) : null}
                    {/* Show email if available */}
                    {result.candidateInfo.email ? (
                      <div className="flex items-center text-xs">
                        <span className="text-gray-600 font-medium w-20">Email:</span>
                        <span className="text-gray-800">{result.candidateInfo.email}</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No candidate information from API</div>
                )}
              </div>
            </div>

            {/* HR Assessment Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium text-gray-700">HR Assessment</h4>
                {!hasHrData() && !isHrDataLoading && (
                  <button 
                    onClick={generateHrData}
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                  >
                    <UserPlus size={12} className="mr-1" />
                    Generate
                  </button>
                )}
              </div>
              
              {hrDataError && (
                <div className="bg-red-50 p-2 mb-2 rounded-md">
                  <p className="text-xs text-red-600">{hrDataError}</p>
                </div>
              )}
              
              <HRAssessment 
                hrAnalysis={result?.hrAnalysis}
                hrAssessment={result?.hrAssessment}
                hrRecommendations={result?.hrRecommendations}
                isLoading={isHrDataLoading}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - PDF Viewer */}
        <div className={`bg-gray-100 rounded-lg border border-gray-200 shadow-sm flex-1 flex flex-col ${isFullScreen ? 'fixed inset-0 z-50 p-4' : ''}`}>
          <div className="flex justify-between items-center p-2 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-800">{result.filename}</div>
            <div className="flex space-x-2">
              <button 
                onClick={async () => {
                  try {
                    if (result?.fileUrl) {
                      // Get a download URL for the file
                      const downloadUrl = await documentsService.getDownloadUrl(result.fileUrl);
                      
                      // Create a temporary anchor element to trigger download
                      const downloadLink = document.createElement('a');
                      downloadLink.href = downloadUrl;
                      downloadLink.download = result.filename || 'resume.pdf';
                      downloadLink.target = "_blank"; // Open in new tab to avoid navigation issues
                      document.body.appendChild(downloadLink);
                      downloadLink.click();
                      document.body.removeChild(downloadLink);
                    } else {
                      console.error('No file URL available for download');
                    }
                  } catch (error) {
                    console.error('Error downloading file:', error);
                  }
                }} 
                className="p-1 rounded hover:bg-gray-200" 
                title="Download PDF"
                disabled={!result?.fileUrl}
              >
                <Download size={16} />
              </button>
              <button 
                onClick={toggleFullScreen} 
                className="p-1 rounded hover:bg-gray-200" 
                title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex justify-center p-3 bg-gray-50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <LottieAnimation 
                  animationUrl={LOADER_ANIMATION} 
                  width={80} 
                  height={80} 
                  className="opacity-75" 
                />
                <p className="text-gray-600 text-sm mt-2">Loading document...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full p-6 text-center">
                <p className="text-red-500 mb-3">{error}</p>
                <button 
                  onClick={handleRetry}
                  className="flex items-center px-3 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                >
                  <RefreshCw size={14} className="mr-2" />
                  Retry ({loadAttempts + 1}/{maxLoadAttempts})
                </button>
              </div>
            ) : pdfUrl ? (
              <div className="w-full h-full transition-opacity duration-300">
                <SimplePDFViewer
                  pdfUrl={pdfUrl}
                  onError={handlePdfError}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No PDF available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeDetails; 