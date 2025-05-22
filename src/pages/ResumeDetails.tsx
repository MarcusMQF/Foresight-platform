import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, FileText, Zap, ArrowLeft, Maximize, Minimize, RefreshCw, Download } from 'lucide-react';
import { AnalysisResult } from '../services/resume-analysis.service';
import { DocumentsService } from '../services/documents.service';
import { supabase } from '../lib/supabase';
import SimplePDFViewer from '../components/SimplePDFViewer';
import resumeAnalysisService from '../services/resume-analysis.service';

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
    // Load result from localStorage or database
    const loadResult = async () => {
      try {
        console.log('Loading result for ID:', resultId);
        let selectedResult: AnalysisResult | null = null;
        
        // First try to load from localStorage
        const storedResults = localStorage.getItem('resumeAnalysisResults');
        if (storedResults) {
          console.log('Found results in localStorage');
          const parsedResults = JSON.parse(storedResults) as AnalysisResult[];
          
          if (resultId) {
            // Find the result with matching filename
            selectedResult = parsedResults.find(r => r.filename === resultId) || null;
            
            if (selectedResult) {
              console.log('Found result in localStorage');
            } else {
              console.log('Result not found in localStorage, will try database');
            }
          } else if (parsedResults.length > 0) {
            // If no ID is specified, use the first result from localStorage
            selectedResult = parsedResults[0];
            console.log('No ID specified, using first result from localStorage');
          }
        }
        
        // If not found in localStorage, try the database
        if (!selectedResult && resultId) {
          console.log('Attempting to load result from database');
          
          try {
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
            
            if (folderId) {
              console.log('Looking up file in database with name:', resultId);
              
              // First, find the file ID by filename
              const { data: files, error: filesError } = await supabase
                .from('files')
                .select('id, name, url')
                .eq('name', resultId)
                .limit(1);
              
              if (filesError) {
                console.error('Error fetching file:', filesError);
              } else if (files && files.length > 0) {
                console.log('Found file in database:', files[0]);
                const fileId = files[0].id;
                
                // Now get the analysis result for this file
                const { data: analysisData, error: analysisError } = await supabase
                  .from('analysis_results')
                  .select('*')
                  .eq('file_id', fileId)
                  .eq('userId', userId)
                  .order('created_at', { ascending: false })
                  .limit(1);
                
                if (analysisError) {
                  console.error('Error fetching analysis result:', analysisError);
                } else if (analysisData && analysisData.length > 0) {
                  console.log('Found analysis result in database:', analysisData[0]);
                  
                  // Transform database result to match our AnalysisResult interface
                  selectedResult = {
                    id: analysisData[0].id,
                    file_id: fileId,
                    filename: resultId,
                    fileUrl: files[0].url,
                    score: analysisData[0].match_score,
                    matchedKeywords: Array.isArray(analysisData[0].strengths) 
                      ? analysisData[0].strengths 
                      : JSON.parse(analysisData[0].strengths || '[]'),
                    missingKeywords: Array.isArray(analysisData[0].weaknesses) 
                      ? analysisData[0].weaknesses 
                      : JSON.parse(analysisData[0].weaknesses || '[]'),
                    recommendations: [], // We don't store recommendations in the database yet
                    analyzed_at: analysisData[0].created_at
                  };
                }
              }
            }
          } catch (dbError) {
            console.error('Error retrieving from database:', dbError);
          }
        }
        
        if (selectedResult) {
          console.log('Setting result:', selectedResult);
          setResult(selectedResult);
          fetchPdfUrl(selectedResult);
        } else {
          console.error('Result not found in localStorage or database');
          navigate('/resume-analysis-results');
        }
      } catch (error) {
        console.error('Error loading result:', error);
        navigate('/resume-analysis-results');
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
  }, [error, loadAttempts, result]);

  // Fetch the PDF URL for the selected resume
  const fetchPdfUrl = async (selectedResult: AnalysisResult) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If the result already has a fileUrl, use it directly
      if (selectedResult.fileUrl) {
        try {
          console.log('Getting file from storage URL:', selectedResult.fileUrl);
          // Get a blob URL directly for the file
          const blobUrl = await documentsService.getFileAsBlob(selectedResult.fileUrl);
          console.log('Got blob URL for PDF:', blobUrl);
          
          setPdfUrl(blobUrl);
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('Error getting blob URL from fileUrl:', error);
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
          // Get a blob URL for the file
          const blobUrl = await documentsService.getFileAsBlob(files[0].url);
          console.log('Created blob URL for PDF:', blobUrl);
          
          setPdfUrl(blobUrl);
          setIsLoading(false);
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
    // This ensures "Back to Files" will work on the results page
    navigate('/resume-analysis-results');
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
      fetchPdfUrl(result);
    }
  };

  if (!result) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center mb-3">
        <button
          onClick={backToResults}
          className="flex items-center text-sm text-gray-500 hover:text-gray-800 mr-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Results
        </button>
        
        <button
          onClick={backToFiles}
          className="flex items-center text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Files
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
                  <div className="px-3 py-1 bg-orange-50 rounded-full">
                    <span className="text-orange-700 font-medium text-xs">Score: {result.score}%</span>
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
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading PDF...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full p-6 text-center">
                <p className="text-red-500 mb-3">{error}</p>
                <button 
                  onClick={handleRetry}
                  className="flex items-center px-3 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                >
                  <RefreshCw size={14} className="mr-2" />
                  Retry
                </button>
              </div>
            ) : pdfUrl ? (
              <SimplePDFViewer
                pdfUrl={pdfUrl}
                onError={(errorMsg) => setError(errorMsg)}
              />
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