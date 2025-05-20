import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, AlertTriangle, FileText, Zap, ArrowLeft, Search, ArrowDown, ArrowUp, ExternalLink } from 'lucide-react';
import { AnalysisResult } from '../services/resume-analysis.service';

const ResumeAnalysisResults: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'filename'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'detail'>('table');
  const [folderId, setFolderId] = useState<string | null>(null);

  useEffect(() => {
    // Load results from localStorage
    const storedResults = localStorage.getItem('resumeAnalysisResults');
    const storedJobDescription = localStorage.getItem('jobDescription');
    const storedFolderId = localStorage.getItem('currentFolderId');
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults) as AnalysisResult[];
        setResults(parsedResults);
      } catch (error) {
        console.error('Error parsing stored results:', error);
      }
    } else {
      // No results found, redirect back to documents
      navigate('/documents');
    }
    
    if (storedJobDescription) {
      setJobDescription(storedJobDescription);
    }

    if (storedFolderId) {
      setFolderId(storedFolderId);
    }
  }, [navigate]);

  // Filter results based on search term
  const filteredResults = results.filter(result =>
    result.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort results based on sort criteria
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'score') {
      return sortOrder === 'asc' ? a.score - b.score : b.score - a.score;
    } else {
      return sortOrder === 'asc'
        ? a.filename.localeCompare(b.filename)
        : b.filename.localeCompare(a.filename);
    }
  });

  // Handle sort change
  const toggleSort = (column: 'score' | 'filename') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc'); // Default to descending
    }
  };

  // View resume details
  const viewResumeDetails = (result: AnalysisResult) => {
    setSelectedResult(result);
    setViewMode('detail');
  };

  // Back to results table
  const backToResults = () => {
    setSelectedResult(null);
    setViewMode('table');
  };

  // Return to files view
  const returnToFiles = () => {
    if (folderId) {
      navigate(`/documents/${folderId}`);
    } else {
      navigate('/documents');
    }
  };

  // Render score badge with appropriate color
  const renderScoreBadge = (score: number) => {
    let bgColor = 'bg-red-50 text-red-700';
    if (score >= 80) {
      bgColor = 'bg-green-50 text-green-700';
    } else if (score >= 60) {
      bgColor = 'bg-yellow-50 text-yellow-700';
    }
    
    return (
      <div className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${bgColor}`}>
        {score}%
      </div>
    );
  };

  // Render resume detail view
  const renderResumeDetails = () => {
    if (!selectedResult) return null;

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
                <p className="text-xs text-gray-500">{selectedResult.filename}</p>
              </div>
              <div className="px-3 py-1 bg-orange-50 rounded-full">
                <span className="text-orange-700 font-medium text-xs">Score: {selectedResult.score}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Matched Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {selectedResult.matchedKeywords.map((keyword, index) => (
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
              {selectedResult.missingKeywords.map((keyword, index) => (
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
              {selectedResult.recommendations.map((recommendation, index) => (
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
            onClick={backToResults}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors duration-200 flex items-center"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Results
          </button>
        </div>
      </div>
    );
  };

  // Render results table view
  const renderResultsTable = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search resumes..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500 transition-colors duration-200"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={returnToFiles}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors duration-200 flex items-center"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Back to Files
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-800">Resume Analysis Results</h3>
            <p className="text-xs text-gray-500 mt-1">
              {results.length} {results.length === 1 ? 'resume' : 'resumes'} analyzed against the job description
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none"
                      onClick={() => toggleSort('filename')}
                    >
                      Resume
                      {sortBy === 'filename' && (
                        sortOrder === 'asc' ? 
                          <ArrowUp size={14} className="ml-1" /> : 
                          <ArrowDown size={14} className="ml-1" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center focus:outline-none"
                      onClick={() => toggleSort('score')}
                    >
                      Match Score
                      {sortBy === 'score' && (
                        sortOrder === 'asc' ? 
                          <ArrowUp size={14} className="ml-1" /> : 
                          <ArrowDown size={14} className="ml-1" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matched Keywords
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedResults.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No results found
                    </td>
                  </tr>
                ) : (
                  sortedResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-1.5 bg-gray-100 rounded mr-3">
                            <FileText size={16} className="text-gray-500" />
                          </div>
                          <div className="text-sm text-gray-900">{result.filename}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderScoreBadge(result.score)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {result.matchedKeywords.slice(0, 3).map((keyword, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                              {keyword}
                            </span>
                          ))}
                          {result.matchedKeywords.length > 3 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                              +{result.matchedKeywords.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => viewResumeDetails(result)}
                          className="text-orange-600 hover:text-orange-800 flex items-center justify-end"
                        >
                          View Details
                          <ExternalLink size={14} className="ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 -ml-1">
      <div>
        <button
          onClick={viewMode === 'detail' ? backToResults : returnToFiles}
          className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-2"
        >
          <ArrowLeft size={16} className="mr-1" />
          {viewMode === 'detail' ? 'Back to Results' : 'Back to Files'}
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
          {viewMode === 'detail' ? 'Resume Details' : 'ATS Analysis Results'}
        </h1>
        <p className="text-gray-500">
          {viewMode === 'detail' 
            ? 'Detailed analysis of the selected resume' 
            : 'View and compare resume matches against the job description'}
        </p>
      </div>

      {viewMode === 'table' ? renderResultsTable() : renderResumeDetails()}
    </div>
  );
};

export default ResumeAnalysisResults; 