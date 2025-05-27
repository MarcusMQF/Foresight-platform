import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Search, ArrowLeft, ArrowDown, ArrowUp, ExternalLink, Trash2, Loader2, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { AnalysisResult } from '../services/resume-analysis.service';
import { supabase } from '../lib/supabase';
import { ATSService } from '../services';
import ConfirmationDialog from '../components/Dialogs/ConfirmationDialog';
import LottieAnimation from '../components/UI/LottieAnimation';
import { LOADER_ANIMATION } from '../utils/animationPreloader';
import MatchScoreBadge from '../components/UI/MatchScoreBadge';

const ResumeAnalysisResults: React.FC = () => {
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId: string }>();
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'filename'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [folderName, setFolderName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<AnalysisResult | null>(null);
  const [deleting, setDeleting] = useState(false);
  const atsService = new ATSService();

  // Load results when component mounts
  useEffect(() => {
    // Load results from localStorage and Supabase
    const loadResults = async () => {
      setLoading(true);
      
      // Get folder ID either from URL param or localStorage
      const storedFolderId = folderId || localStorage.getItem('currentFolderId');
      
      if (!storedFolderId) {
        console.log('No folder ID available');
        setLoading(false);
        setResults([]);
        navigate('/documents');
        return;
      }
      
      // Store the folder ID in localStorage for future use
      if (folderId) {
        localStorage.setItem('currentFolderId', folderId);
      }
      
      // Try to get folder name
      try {
        const { data: folderData, error: folderError } = await supabase
          .from('folders')
          .select('name')
          .eq('id', storedFolderId)
          .single();
          
        if (!folderError && folderData) {
          setFolderName(folderData.name);
        }
      } catch (error) {
        console.error('Error getting folder name:', error);
      }
      
      try {
        console.log('Starting direct query approach for folder:', storedFolderId);
        
        // Get all files in this folder
        const { data: files, error: filesError } = await supabase
          .from('files')
          .select('id, name, folderId')
          .eq('folderId', storedFolderId);
        
        if (filesError) {
          console.error('Error getting files:', filesError);
          setLoading(false);
          setResults([]);
          return;
        }
        
        if (!files || files.length === 0) {
          console.log('No files found in this folder');
          setLoading(false);
          setResults([]);
          return;
        }
        
        console.log(`Found ${files.length} files in folder`);
        
        // Get file IDs
        const fileIds = files.map(f => f.id);
        
        // Get all analysis results for these files
        const { data: analysisResults, error: analysisError } = await supabase
          .from('analysis_results')
          .select('*')
          .in('file_id', fileIds);
        
        if (analysisError) {
          console.error('Error getting analysis results:', analysisError);
          setLoading(false);
          setResults([]);
          return;
        }
        
        console.log(`Found ${analysisResults?.length || 0} analysis results`);
        
        if (!analysisResults || analysisResults.length === 0) {
          console.log('No analysis results found for files in this folder');
          setLoading(false);
          setResults([]);
          return;
        }
        
        // Create a map of file ID to file name for easy lookup
        const fileMap = new Map();
        files.forEach(file => {
          fileMap.set(file.id, file.name);
        });
        
        // Transform analysis results to match our AnalysisResult interface
        const transformedResults: AnalysisResult[] = analysisResults.map(result => {
          // Get the file name from the map
          const fileName = fileMap.get(result.file_id) || 'Unknown File';
          
          // Parse strengths and weaknesses
          let matchedKeywords = [];
          let missingKeywords = [];
          
          try {
            if (typeof result.strengths === 'string') {
              matchedKeywords = JSON.parse(result.strengths);
            } else if (Array.isArray(result.strengths)) {
              matchedKeywords = result.strengths;
            } else if (result.strengths && typeof result.strengths === 'object') {
              // It might be already a parsed object
              matchedKeywords = Object.values(result.strengths);
            }
          } catch (e) {
            console.error('Error parsing strengths:', e);
          }
          
          try {
            if (typeof result.weaknesses === 'string') {
              missingKeywords = JSON.parse(result.weaknesses);
            } else if (Array.isArray(result.weaknesses)) {
              missingKeywords = result.weaknesses;
            } else if (result.weaknesses && typeof result.weaknesses === 'object') {
              // It might be already a parsed object
              missingKeywords = Object.values(result.weaknesses);
            }
          } catch (e) {
            console.error('Error parsing weaknesses:', e);
          }
          
          return {
            id: result.id,
            file_id: result.file_id,
            folder_id: storedFolderId,
            filename: fileName,
            score: result.match_score,
            matchedKeywords,
            missingKeywords,
            recommendations: [],
            analyzed_at: result.created_at
          };
        });
        
        console.log('Final transformed results:', transformedResults.length);
        
        // Save to folder-specific localStorage for future reference
        try {
          const folderAnalyzedFilesKey = `analyzed_files_${storedFolderId}`;
          const analyzedFileIds = transformedResults.map(r => r.file_id).filter(id => id !== undefined) as string[];
          localStorage.setItem(folderAnalyzedFilesKey, JSON.stringify(analyzedFileIds));
        } catch (storageError) {
          console.error('Error updating folder-specific localStorage:', storageError);
        }
        
        // Set results
        setResults(transformedResults);
      } catch (error) {
        console.error('Error in direct query approach:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [navigate, folderId]);

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
    // Store the current folder ID in localStorage for use by the details page
    if (folderId) {
      localStorage.setItem('currentFolderId', folderId);
    } else {
      const storedFolderId = localStorage.getItem('currentFolderId');
      if (!storedFolderId) {
        // If no folder ID is available, try to get it from the result
        if (result.folder_id) {
          localStorage.setItem('currentFolderId', result.folder_id);
        }
      }
    }
    
    // Add some debugging
    console.log('Navigating to resume details:', result.filename);
    console.log('Current folder ID:', folderId || localStorage.getItem('currentFolderId'));
    
    // Navigate to the detailed view page
    navigate(`/resume-details/${encodeURIComponent(result.filename)}`);
  };

  // Return to files
  const returnToFiles = () => {
    if (folderId) {
      navigate(`/documents/${folderId}`);
    } else {
      const storedFolderId = localStorage.getItem('currentFolderId');
      if (storedFolderId) {
        navigate(`/documents/${storedFolderId}`);
      } else {
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
      
      console.log(`Attempting to delete analysis result:`, resultToDelete);
      
      // Check if we have an ID and file_id
      if (!resultToDelete.id && !resultToDelete.file_id) {
        console.error('Cannot delete: Both ID and file_id are missing');
        alert('Could not delete analysis result: Missing ID information');
        return;
      }
      
      let success = false;
      
      // Try to delete by analysis ID first
      if (resultToDelete.id) {
        console.log(`Deleting by analysis ID: ${resultToDelete.id}`);
        const result = await atsService.deleteAnalysisResult(resultToDelete.id, userId);
        success = result.success;
          
        if (success) {
          console.log(`Successfully deleted analysis result by ID`);
        } else {
          console.log(`Failed to delete by ID, will try file_id fallback if available`);
        }
      }
      
      // If ID delete failed or ID wasn't available, try deleting by file_id
      if (!success && resultToDelete.file_id) {
        console.log(`Deleting by file_id: ${resultToDelete.file_id}`);
        success = await atsService.deleteFileAnalysis(resultToDelete.file_id, userId);
        
        if (success) {
          console.log(`Successfully deleted analysis result by file_id`);
        } else {
          console.log(`Failed to delete by file_id as well`);
        }
      }
      
      if (success) {
        // Update the UI state to remove ONLY the deleted item
        setResults(prevResults => prevResults.filter(r => {
          // Keep all items EXCEPT the one we just deleted
          // If we deleted by ID, filter out only that ID
          if (resultToDelete.id && r.id === resultToDelete.id) {
            return false;
          }
          // If we deleted by file_id, filter out only that file_id
          if (resultToDelete.file_id && r.file_id === resultToDelete.file_id) {
            return false;
          }
          // Otherwise keep the result
          return true;
        }));
        
        // Update folder-specific cache
        if (folderId && resultToDelete.file_id) {
          try {
            const folderAnalyzedFilesKey = `analyzed_files_${folderId}`;
            const folderCacheStr = localStorage.getItem(folderAnalyzedFilesKey);
            
            if (folderCacheStr) {
              const folderCache = JSON.parse(folderCacheStr) as string[];
              const updatedCache = folderCache.filter(id => id !== resultToDelete.file_id);
              localStorage.setItem(folderAnalyzedFilesKey, JSON.stringify(updatedCache));
              console.log(`Updated folder-specific cache: removed ${resultToDelete.file_id}`);
            }
          } catch (cacheError) {
            console.error('Error updating folder cache:', cacheError);
          }
        }
        
        // Check if we have any results left after deletion
        setTimeout(() => {
          if (results.length <= 1) {
            console.log('Last result deleted, redirecting back to files');
            returnToFiles();
          }
        }, 500);
      } else {
        console.error('Failed to delete analysis result from database');
        alert('Failed to delete analysis result. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting analysis result:', error);
      alert('Error deleting analysis result: ' + String(error));
    } finally {
      // Make sure we always reset the UI state
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setResultToDelete(null);
    }
  };

  // Render score badge with color and icon based on score - replaced with MatchScoreBadge component
  const renderScoreBadge = (score: number) => {
    return <MatchScoreBadge score={score} size="md" />;
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
            <h3 className="text-xs font-medium text-gray-800">
              Resume Analysis Results {folderName && `- ${folderName}`}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {results.length} {results.length === 1 ? 'resume' : 'resumes'} analyzed against the job description
            </p>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <LottieAnimation 
                  animationUrl={LOADER_ANIMATION} 
                  width={80} 
                  height={80} 
                  className="mx-auto opacity-75 mb-3"
                />
                <p className="text-sm text-gray-500">Loading analysis results...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-block rounded-full p-3 bg-gray-100 mb-3">
                  <FileText size={24} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-700 font-medium mb-1">No analysis results found for this folder</p>
                <p className="text-xs text-gray-500 mb-4">Analyze some resumes in this folder to see results here.</p>
                <button
                  onClick={returnToFiles}
                  className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors duration-200 inline-flex items-center"
                >
                  <ArrowLeft size={14} className="mr-1.5" />
                  Return to Files
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center cursor-pointer" onClick={() => toggleSort('filename')}>
                          Resume
                          {sortBy === 'filename' && (
                            <span className="ml-1">
                              {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center cursor-pointer" onClick={() => toggleSort('score')}>
                          Match Score
                          {sortBy === 'score' && (
                            <span className="ml-1">
                              {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                            </span>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key Matches
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Missing Skills
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedResults.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText size={18} className="text-gray-400 mr-2" />
                            <div className="ml-1 text-xs text-gray-700 max-w-xs truncate" title={result.filename}>
                              {result.filename}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderScoreBadge(result.score)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {result.matchedKeywords && result.matchedKeywords.length > 0 ? (
                              result.matchedKeywords.slice(0, 3).map((keyword, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-800 border border-green-100" title={keyword}>
                                  {keyword.length > 15 ? `${keyword.substring(0, 15)}...` : keyword}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">No matches found</span>
                            )}
                            {result.matchedKeywords && result.matchedKeywords.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600" title={result.matchedKeywords.slice(3).join(', ')}>
                                +{result.matchedKeywords.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {result.missingKeywords && result.missingKeywords.length > 0 ? (
                              result.missingKeywords.slice(0, 3).map((keyword, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-800 border border-red-100" title={keyword}>
                                  {keyword.length > 15 ? `${keyword.substring(0, 15)}...` : keyword}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">No missing skills</span>
                            )}
                            {result.missingKeywords && result.missingKeywords.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600" title={result.missingKeywords.slice(3).join(', ')}>
                                +{result.missingKeywords.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => viewResumeDetails(result)} 
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none mr-2"
                            title="View detailed analysis"
                          >
                            <ExternalLink size={14} className="mr-1" />
                            Details
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(result)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none"
                            title="Delete analysis result"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
          ATS Analysis Results {folderName && `for ${folderName}`}
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