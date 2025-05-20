import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, Zap, Clock } from 'lucide-react';
import { ResumeAnalysisService, AnalysisResult } from '../../services/resume-analysis.service';
import { FileItem } from '../../services/documents.service';
import { useNavigate, useParams } from 'react-router-dom';

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
  const [batchResults, setBatchResults] = useState<AnalysisResult[] | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  
  // Initialize service
  const analysisService = new ResumeAnalysisService();
  
  // Reset state when dialog is opened
  useEffect(() => {
    if (isOpen) {
      setJobDescription('');
      setResults(null);
      setBatchResults(null);
      setAnalyzing(false);
      setProgress(0);
      setProcessingStep('');
      
      // Set batch mode if multiple files are available
      setIsBatchMode(folderFiles.length > 1);
    }
  }, [isOpen, folderFiles]);

  // Update progress during analysis
  useEffect(() => {
    if (analyzing) {
      const totalTime = folderFiles.length > 1 ? folderFiles.length * 500 : 3000; // Same as setTimeout in handleSubmit
      const interval = setInterval(() => {
        setProgress(prev => {
          // Ensure we don't go past 99% until the actual processing is done
          if (prev >= 99) {
            clearInterval(interval);
            return 99;
          }
          // Calculate step size to reach ~99% by the end of the processing time
          const step = 99 / (totalTime / 100);
          return Math.floor(Math.min(99, prev + step));
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [analyzing, folderFiles.length]);

  // Update estimated time based on number of files
  useEffect(() => {
    if (analyzing) {
      const baseTime = 5; // base seconds for processing
      const timePerFile = 2; // seconds per file
      const totalEstimatedTime = baseTime + (folderFiles.length * timePerFile);
      setEstimatedTime(totalEstimatedTime);

      // Simulate processing steps
      const steps = ['Starting analysis', 'Extracting text', 'Analyzing keywords', 'Calculating matches'];
      let currentStep = 0;
      
      setProcessingStep(steps[0]);

      const stepInterval = setInterval(() => {
        currentStep = (currentStep + 1) % steps.length;
        setProcessingStep(steps[currentStep]);
        
        // When progress is high but not complete, stay in final processing step
        if (progress > 90) {
          clearInterval(stepInterval);
          setProcessingStep('Finalizing results');
        }
      }, totalEstimatedTime * 250 / steps.length);

      return () => clearInterval(stepInterval);
    }
  }, [analyzing, folderFiles.length, progress]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (folderFiles.length === 0 || !jobDescription) {
      return;
    }
    
    setAnalyzing(true);
    setProgress(0);
    setProcessingStep('Starting analysis');
    
    try {
      if (folderFiles.length === 1) {
        // Single file analysis
        setTimeout(() => {
          // Mock results for single file
          const singleResult = {
            score: 76,
            matchedKeywords: ['project management', 'team leadership', 'agile', 'communication'],
            missingKeywords: ['data analysis', 'python', 'machine learning'],
            recommendations: [
              'Add more specific details about your data analysis skills',
              'Include python programming experience if applicable',
              'Highlight any machine learning or AI projects you\'ve worked on'
            ],
            filename: folderFiles[0].name
          };
          
          // Set progress to 100% only when processing is complete
          setProgress(100);
          
          // Small delay to show 100% before navigating
          setTimeout(() => {
            localStorage.setItem('resumeAnalysisResults', JSON.stringify([singleResult]));
            localStorage.setItem('jobDescription', jobDescription);
            // Store the current folder ID
            if (folderId) {
              localStorage.setItem('currentFolderId', folderId);
            }
            onClose();
            navigate('/resume-analysis-results');
          }, 500);
          
          // In a real implementation:
          // const result = await analysisService.analyzeResume(folderFiles[0], jobDescription);
          // setProgress(100);
          // setTimeout(() => {
          //   localStorage.setItem('resumeAnalysisResults', JSON.stringify([result]));
          //   localStorage.setItem('jobDescription', jobDescription);
          //   if (folderId) {
          //     localStorage.setItem('currentFolderId', folderId);
          //   }
          //   onClose();
          //   navigate('/resume-analysis-results');
          // }, 500);
        }, 3000);
      } else {
        // Multiple files analysis
        setTimeout(() => {
          // Mock results for batch analysis
          const mockResults: AnalysisResult[] = folderFiles.map((file, index) => ({
            score: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
            matchedKeywords: ['project management', 'team leadership', 'agile', 'communication'].slice(0, 3 + index % 2),
            missingKeywords: ['data analysis', 'python', 'machine learning'].slice(0, 2 + index % 2),
            recommendations: [
              'Add more specific details about your data analysis skills',
              'Include python programming experience if applicable',
              'Highlight any machine learning or AI projects you\'ve worked on'
            ].slice(0, 2 + index % 2),
            filename: file.name
          }));
          
          // Set progress to 100% only when processing is complete
          setProgress(100);
          
          // Small delay to show 100% before navigating
          setTimeout(() => {
            localStorage.setItem('resumeAnalysisResults', JSON.stringify(mockResults));
            localStorage.setItem('jobDescription', jobDescription);
            // Store the current folder ID
            if (folderId) {
              localStorage.setItem('currentFolderId', folderId);
            }
            onClose();
            navigate('/resume-analysis-results');
          }, 500);
          
          // In a real implementation:
          // const results = await analysisService.analyzeFolderContent(folderFiles, jobDescription);
          // setProgress(100);
          // setTimeout(() => {
          //   localStorage.setItem('resumeAnalysisResults', JSON.stringify(results));
          //   localStorage.setItem('jobDescription', jobDescription);
          //   if (folderId) {
          //     localStorage.setItem('currentFolderId', folderId);
          //   }
          //   onClose();
          //   navigate('/resume-analysis-results');
          // }, 500);
        }, folderFiles.length * 500); // Longer delay for multiple files
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalyzing(false);
      setProgress(0);
    }
  };
  
  const resetForm = () => {
    setJobDescription('');
    setResults(null);
    setBatchResults(null);
  };
  
  // Render batch results
  const renderBatchResults = () => {
    if (!batchResults) return null;
    
    // Find top match
    const topMatch = batchResults.reduce((prev, current) => 
      (current.score > prev.score) ? current : prev, batchResults[0]);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900">Batch Analysis Results</h3>
          <div className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">
            {batchResults.length} files analyzed
          </div>
        </div>
        
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <FileText size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-green-800">Best Match</p>
              <p className="text-sm font-semibold text-green-900">{topMatch.filename}</p>
              <p className="text-xs text-green-700">Score: {topMatch.score}%</p>
            </div>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batchResults.sort((a, b) => b.score - a.score).map((result, index) => (
                <tr key={index} className={result.filename === topMatch.filename ? 'bg-green-50' : ''}>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">{result.filename}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                      result.score >= 80 ? 'bg-green-50 text-green-700' : 
                      result.score >= 60 ? 'bg-yellow-50 text-yellow-700' : 
                      'bg-red-50 text-red-700'
                    }`}>
                      {result.score}%
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-right">
                    <button 
                      className="text-orange-600 hover:text-orange-800 font-medium"
                      onClick={() => {
                        setResults(result);
                        setBatchResults(null);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="pt-2 flex justify-end space-x-3">
          <button
            onClick={resetForm}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            Check Different Job
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-md hover:bg-orange-600 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // Render resume analysis results
  const renderResumeAnalysis = () => {
    if (!results) return null;

    return (
      <div className="space-y-5 p-1">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-orange-50 rounded">
            <FileText size={18} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Resume Analysis</h3>
                <p className="text-xs text-gray-500">{results.filename}</p>
              </div>
              <div className="px-3 py-1 bg-orange-50 rounded-full">
                <span className="text-orange-700 font-medium text-xs">Score: {results.score}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Matched Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {results.matchedKeywords.map((keyword, index) => (
                <span 
                  key={index} 
                  className="flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md"
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
              {results.missingKeywords.map((keyword, index) => (
                <span 
                  key={index} 
                  className="flex items-center px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md"
                >
                  <AlertTriangle size={12} className="mr-1" />
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Recommendations</h4>
            <div className="bg-orange-50 rounded-md p-3 space-y-2">
              {results.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start">
                  <Zap size={14} className="text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-xs text-orange-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="pt-2 flex justify-end space-x-3">
          <button
            onClick={resetForm}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            Check Another Resume
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-md hover:bg-orange-600 transition-colors duration-200"
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

    const remainingTime = Math.max(0, Math.ceil(estimatedTime * (100 - progress) / 100));
    
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-orange-500" />
            <h3 className="text-sm font-medium text-gray-900">Processing Resumes</h3>
          </div>
          <div className="text-sm text-orange-500 font-medium">{progress}%</div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-orange-500 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>{processingStep}</div>
          <div>Est. {remainingTime} seconds remaining</div>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          {isBatchMode 
            ? `Analyzing ${folderFiles.length} resumes against the job description...` 
            : 'Analyzing your resume against the job description...'}
        </p>
      </div>
    );
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={analyzing ? undefined : onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {isBatchMode ? 'Batch Resume ATS Checker' : 'Resume ATS Checker'}
          </h2>
          {!analyzing && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-50"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
          {analyzing ? (
            renderProgressIndicator()
          ) : results ? (
            renderResumeAnalysis()
          ) : batchResults ? (
            renderBatchResults()
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-50 rounded-full">
                    <Zap size={16} className="text-orange-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">ATS Checker</h3>
                </div>
                
                <div className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">
                  {folderFiles.length} {folderFiles.length === 1 ? 'file' : 'files'} to analyze
                </div>
              </div>
              
              <p className="text-xs text-gray-600">
                Enter a job description to analyze {folderFiles.length === 1 ? 'this resume' : 'these resumes'} against. 
                The ATS checker will analyze keyword matches, calculate an overall score, and provide recommendations for improvement.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <textarea
                    id="jobDescription"
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border focus:border-orange-400 transition-colors duration-200 h-32 resize-y"
                    required
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={analyzing || !jobDescription || folderFiles.length === 0}
                    className="px-4 py-2 bg-orange-500 text-white text-xs font-medium rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing ? 'Analyzing...' : `Analyze ${folderFiles.length === 1 ? 'Resume' : `${folderFiles.length} Resumes`}`}
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