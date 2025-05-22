import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, ArrowLeft, ArrowDown, ArrowUp, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { AnalysisResult } from '../services/resume-analysis.service';
import { supabase } from '../lib/supabase';
import { ATSService } from '../services';
import ConfirmationDialog from '../components/Dialogs/ConfirmationDialog';

const ResumeAnalysisResults: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'filename'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<AnalysisResult | null>(null);
  const [deleting, setDeleting] = useState(false);
  const atsService = new ATSService();

  useEffect(() => {
    // Load results from localStorage and Supabase
    const loadResults = async () => {
      setLoading(true);
      console.log('Loading analysis results...');
      
      // Get data from localStorage
      const storedResults = localStorage.getItem('resumeAnalysisResults');
      const storedFolderId = localStorage.getItem('currentFolderId');
      
      let localResults: AnalysisResult[] = [];
      if (storedResults) {
        try {
          localResults = JSON.parse(storedResults) as AnalysisResult[];
          console.log('Loaded from localStorage:', localResults.length, 'results');
          console.log('localStorage file IDs:', localResults.map(r => r.file_id).join(', '));
        } catch (error) {
          console.error('Error parsing stored results:', error);
        }
      }
      
      if (storedFolderId) {
        setFolderId(storedFolderId);
        console.log('Current folder ID:', storedFolderId);
        
        // Save folder ID to localStorage to ensure it's available for navigation
        localStorage.setItem('currentFolderId', storedFolderId);
        
        try {
          // Direct database query instead of using the RPC function
          console.log('Querying database for analysis results...');
          
          const { data: dbData, error: dbError } = await supabase
            .from('files_with_analysis')
            .select('*')
            .eq('folder_id', storedFolderId)
            .not('analysis_id', 'is', null);
          
          if (dbError) {
            console.error('Error querying database:', dbError);
            throw dbError;
          }
          
          // Transform database results to match our AnalysisResult interface
          const dbResults: AnalysisResult[] = dbData
            .filter(item => item.match_score !== null)
            .map(item => ({
              id: item.analysis_id, // Use the analysis_id as the id
              file_id: item.file_id,
              filename: item.file_name,
              score: item.match_score,
              matchedKeywords: item.strengths ? JSON.parse(item.strengths) : [],
              missingKeywords: item.weaknesses ? JSON.parse(item.weaknesses) : [],
              recommendations: [],
              analyzed_at: item.analyzed_at
            }));
          
          console.log('Loaded from database:', dbResults.length, 'results');
          console.log('Database file IDs:', dbResults.map(r => r.file_id).join(', '));
          
          // Create a map from all results (both localStorage and database)
          const combinedMap = new Map<string, AnalysisResult>();
          
          // First add all database results to the map
          dbResults.forEach(result => {
            if (result.file_id) {
              combinedMap.set(result.file_id, result);
            }
          });
          
          // Then override with localStorage results which are more recent
          localResults.forEach(result => {
            if (result.file_id) {
              combinedMap.set(result.file_id, result);
            }
          });
          
          // Convert map back to array
          const combinedResults = Array.from(combinedMap.values());
          console.log('Combined results:', combinedResults.length, 'total files');
          console.log('Combined file IDs:', combinedResults.map(r => r.file_id).join(', '));
          
          if (combinedResults.length > 0) {
            setResults(combinedResults);
          } else {
            console.log('No results found, redirecting back to documents');
            navigate(`/documents/${storedFolderId}`);
          }
        } catch (error) {
          console.error('Error loading analysis results from database:', error);
          // Fall back to localStorage results
          if (localResults.length > 0) {
            setResults(localResults);
          } else {
            // If no results found, redirect back to documents
            console.log('No results available, redirecting back to documents');
            navigate(`/documents/${storedFolderId}`);
          }
        }
      } else {
        // No folder ID, just use localStorage results
        if (localResults.length > 0) {
          setResults(localResults);
        } else {
          // No results found, redirect back to documents
          console.log('No folder ID, redirecting back to documents');
          navigate('/documents');
        }
      }
      
      setLoading(false);
    };

    loadResults();
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
    // Navigate to the detailed view page
    navigate(`/resume-details/${encodeURIComponent(result.filename)}`);
  };

  // Return to files view
  const returnToFiles = () => {
    if (folderId) {
      // Double check that we have a valid folder ID
      const storedFolderId = localStorage.getItem('currentFolderId') || folderId;
      navigate(`/documents/${storedFolderId}`);
    } else {
      // Fallback to the folder ID in localStorage if component state doesn't have it
      const storedFolderId = localStorage.getItem('currentFolderId');
      if (storedFolderId) {
        navigate(`/documents/${storedFolderId}`);
      } else {
        // If all else fails, go to the documents root
        navigate('/documents');
      }
    }
  };

  // Handle delete button click
  const handleDeleteClick = (result: AnalysisResult) => {
    setResultToDelete(result);
    setDeleteConfirmOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!resultToDelete) return;
    
    setDeleting(true);
    
    try {
      // Flag to track if the result was successfully deleted
      let isDeleted = false;
      
      // Get current user ID
      let userId = 'temp_user_id';
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          userId = user.id;
        }
      } catch (authError) {
        console.error('Auth error:', authError);
      }
      
      // If the result has an ID, try to delete it from the database
      if (resultToDelete.id) {
        try {
          console.log(`Attempting to delete analysis result ID: ${resultToDelete.id} for file: ${resultToDelete.filename}`);
          
          // Step 1: Delete from analysis_results table
          const { success, fileId } = await atsService.deleteAnalysisResult(resultToDelete.id, userId);
          
          if (success) {
            console.log(`Successfully deleted analysis result from database for file: ${resultToDelete.filename}`);
            
            // Step 2: Force refresh the file's analysis status
            if (fileId) {
              console.log(`Refreshing analysis status for file ID: ${fileId}`);
              await atsService.refreshFileAnalysisStatus(fileId, userId);
            } else if (resultToDelete.file_id) {
              // Fallback to using file_id from resultToDelete
              console.log(`Refreshing analysis status for file ID (fallback): ${resultToDelete.file_id}`);
              await atsService.refreshFileAnalysisStatus(resultToDelete.file_id, userId);
            }
            
            isDeleted = true;
          } else {
            console.log('Database delete failed, will try localStorage only');
          }
        } catch (dbError) {
          console.error('Database error while deleting:', dbError);
          console.log('Continuing with localStorage delete');
        }
      } else {
        console.log('No database ID for this result, deleting from localStorage only');
      }
      
      // Whether database delete succeeded or not, also remove from localStorage
      // This ensures we clean up localStorage entries that might not be in the database
      const storedResults = localStorage.getItem('resumeAnalysisResults');
      if (storedResults) {
        try {
          const parsedResults = JSON.parse(storedResults) as AnalysisResult[];
          const updatedResults = parsedResults.filter(r => 
            r.file_id !== resultToDelete.file_id && 
            r.filename !== resultToDelete.filename
          );
          
          // Update localStorage with filtered results
          localStorage.setItem('resumeAnalysisResults', JSON.stringify(updatedResults));
          console.log(`Removed result from localStorage: ${resultToDelete.filename}`);
          isDeleted = true;
        } catch (error) {
          console.error('Error updating localStorage:', error);
        }
      }
      
      if (isDeleted) {
        // Update the UI state to remove the deleted item
        setResults(prevResults => prevResults.filter(r => 
          (r.file_id !== resultToDelete.file_id) && 
          (r.id !== resultToDelete.id || r.filename !== resultToDelete.filename)
        ));
        
        console.log(`Successfully deleted analysis result for file: ${resultToDelete.filename}`);
      } else {
        console.error('Failed to delete analysis result from any storage');
        alert('Failed to delete analysis result. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting analysis result:', error);
      alert('Error deleting analysis result: ' + String(error));
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setResultToDelete(null);
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
      <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {score}%
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
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-primary-500 transition-colors duration-200"
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
            <h3 className="text-xs font-medium text-gray-800">Resume Analysis Results</h3>
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
                      RESUME
                      {sortBy === 'filename' && (
                        sortOrder === 'asc' ? 
                          <ArrowUp size={14} className="ml-1" /> : 
                          <ArrowDown size={14} className="ml-1" />
                      )}
                    </button>
                  </th>
                  <th className="pr-9 pl-7 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center justify-center mx-auto"
                      onClick={() => toggleSort('score')}
                    >
                      MATCH SCORE
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
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex justify-end pr-[30px]">ACTIONS</div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-xs text-gray-500">
                      Loading analysis results...
                    </td>
                  </tr>
                ) : sortedResults.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-xs text-gray-500">
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
                          <div className="text-xs text-gray-900">{result.filename}</div>
                        </div>
                      </td>
                      <td className="pr-9 pl-3 py-4 whitespace-nowrap text-center">
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
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-4">
                          <button 
                            onClick={() => handleDeleteClick(result)}
                            className={`text-gray-400 hover:text-red-500 inline-flex items-center text-xs font-medium transition-colors ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={deleting}
                            title="Delete this analysis result"
                          >
                            <Trash2 size={14} className="mr-1" />
                            <span>Delete</span>
                          </button>
                          <button 
                            onClick={() => viewResumeDetails(result)}
                            className="text-orange-600 hover:text-orange-800 inline-flex items-center text-xs font-medium"
                          >
                            View Details
                            <ExternalLink size={14} className="ml-1" />
                          </button>
                        </div>
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
          onClick={returnToFiles}
          className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-2"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Files
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
          ATS Analysis Results
        </h1>
        <p className="text-gray-500">
          View and compare resume matches against the job description
        </p>
      </div>

      {renderResultsTable()}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        title="Delete Analysis Result"
        message={`This will permanently delete the analysis result for "${resultToDelete?.filename}". The file itself will not be deleted. This action cannot be undone.`}
        confirmText={deleting ? (
          <span className="flex items-center">
            <Loader2 size={14} className="animate-spin mr-2" />
            Deleting...
          </span>
        ) : "Delete"}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
        isDangerous={true}
      />
    </div>
  );
};

export default ResumeAnalysisResults; 