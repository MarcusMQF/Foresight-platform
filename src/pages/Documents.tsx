import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FolderPlus, 
  Grid, 
  List, 
  Search, 
  Folder,
  MoreVertical,
  FileText,
  Pencil,
  Trash2,
  Upload,
  ArrowLeft,
  Download,
  X,
  AlertTriangle,
  BarChart2,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import CreateFolderDialog from '../components/Dialogs/CreateFolderDialog';
import RenameDialog from '../components/Dialogs/RenameDialog';
import DeleteConfirmDialog from '../components/Dialogs/DeleteConfirmDialog';
import FileUploadDialog from '../components/Dialogs/FileUploadDialog';
import DocumentsLoader from '../components/UI/DocumentsLoader';
import ATSCheckerButton from '../components/UI/ATSCheckerButton';
import ATSCheckerDialog from '../components/Dialogs/ATSCheckerDialog';
import DocumentAnalysisDialog from '../components/Dialogs/DocumentAnalysisDialog';
import { DocumentsService, FolderItem, FileItem } from '../services/documents.service';
import resumeAnalysisService from '../services/resume-analysis.service';
// JSZip for bundling multiple files
import JSZip from 'jszip';
// saveAs from file-saver for downloading zip files
import { saveAs } from 'file-saver';
import CustomCheckbox from '../components/UI/CustomCheckbox';
import { ATSService } from '../services/ats.service';

// Format file size to human-readable format
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId: string }>();
  const [isGridView, setIsGridView] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Bulk actions state
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  
  // ATS checker dialog state
  const [isATSCheckerOpen, setIsATSCheckerOpen] = useState(false);
  const [isDocumentAnalysisOpen, setIsDocumentAnalysisOpen] = useState(false);
  
  // Check if analysis results exist for current folder
  const [, setHasAnalysisResults] = useState(false);
  
  // Track which files have been analyzed
  const [analyzedFileIds, setAnalyzedFileIds] = useState<string[]>([]);
  
  // Document service instance
  const documentsService = new DocumentsService();
  
  // Fake user ID until authentication is implemented
  const TEMP_USER_ID = 'temp-user-id';

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  
  // Single file delete confirmation
  const [showSingleDeleteConfirm, setShowSingleDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [singleDeleteLoading, setSingleDeleteLoading] = useState(false);
  
  // Dropdown state
  const [dropdownState, setDropdownState] = useState({
    isOpen: false,
    folderId: null as string | null,
    position: { top: 0, right: 0 }
  });

  // Click outside handler
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownState(prev => ({ ...prev, isOpen: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Create a ref to store analyzed file IDs that persists across renders
  const analyzedFileIdsRef = useRef<{[folderId: string]: string[]}>({});
  
  // Save analyzed file IDs to ref when they change
  useEffect(() => {
    if (folderId && analyzedFileIds.length > 0) {
      analyzedFileIdsRef.current[folderId] = [...analyzedFileIds];
    }
  }, [folderId, analyzedFileIds]);
  
  // Restore analyzed file IDs from ref when folder changes
  useEffect(() => {
    if (folderId && analyzedFileIdsRef.current[folderId]?.length > 0) {
      // Only set if we have data and it's different from current state
      const savedIds = analyzedFileIdsRef.current[folderId];
      setAnalyzedFileIds(prev => {
        if (JSON.stringify(prev.sort()) !== JSON.stringify(savedIds.sort())) {
          return savedIds;
        }
        return prev;
      });
    }
  }, [folderId]);

  // Load initial data based on route
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setFiles([]);
      setAnalyzedFileIds([]);
      setCurrentFolder(null);
      
      try {
        // If we have a folder ID, fetch the files in that folder
        if (folderId) {
          // Check if the folder exists first
          try {
            // Get folder details
            const { data, error } = await supabase
              .from('folders')
              .select('*')
              .eq('id', folderId)
              .single();
              
            if (error || !data) {
              // Folder not found, redirect to documents
              navigate('/documents');
              return;
            }
            setCurrentFolder(data);
            
            // Save the current folder ID to localStorage for navigation context
            localStorage.setItem('currentFolderId', folderId);
          } catch (folderError) {
            console.error('Error fetching folder:', folderError);
            navigate('/documents');
            return;
          }

          // Fetch files in the folder
          const folderFiles = await documentsService.getFiles(folderId);
          setFiles(folderFiles);
          
          // Always check for analyzed files from the database
          console.log('Checking for analyzed files in folder:', folderId);
          try {
            // Get current user ID
            let userId = TEMP_USER_ID;
            try {
              const { data: { user }, error } = await supabase.auth.getUser();
              if (!error && user) {
                userId = user.id;
              }
            } catch (authError) {
              console.error('Auth error:', authError);
            }
            
            // Get analyzed files from the database
            const analyzedFiles = await resumeAnalysisService.getAnalyzedFilesInFolder(folderId);
            console.log('Found analyzed files:', analyzedFiles.length);
            
            if (analyzedFiles.length > 0) {
              setAnalyzedFileIds(analyzedFiles);
              setHasAnalysisResults(true);
              
              // Update the folder-specific cache
              const folderAnalyzedFilesKey = `analyzed_files_${folderId}`;
              localStorage.setItem(folderAnalyzedFilesKey, JSON.stringify(analyzedFiles));
            } else {
              setAnalyzedFileIds([]);
              setHasAnalysisResults(false);
            }
          } catch (analyzedFilesError) {
            console.error('Error getting analyzed files:', analyzedFilesError);
          }
        } else {
          // Otherwise, fetch all folders
          const userFolders = await documentsService.getFolders(TEMP_USER_ID);
          setFolders(userFolders);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [folderId, navigate]);

  // Update analyzed file IDs when component is focused or mounted
  useEffect(() => {
    // Only run if we're in a folder view
    if (!folderId) return;
    
    // Function to refresh analyzed file IDs
    const refreshAnalyzedFileIds = async () => {
      try {
        // Check if we have folder-specific localStorage data first
        const folderAnalyzedFilesKey = `analyzed_files_${folderId}`;
        let folderAnalyzedFiles: string[] = [];
        
        try {
          const storedFolderData = localStorage.getItem(folderAnalyzedFilesKey);
          if (storedFolderData) {
            folderAnalyzedFiles = JSON.parse(storedFolderData);
            console.log(`Found cached analyzed files for folder ${folderId}:`, folderAnalyzedFiles.length);
          }
        } catch (parseError) {
          console.error('Error parsing folder-specific analyzed files:', parseError);
        }
        
        // First check the folder-specific cache
        if (folderAnalyzedFiles.length > 0) {
          // Verify these files still exist in the current folder
          const fileIdMap = new Map(files.map(file => [file.id, true]));
          const validIds = folderAnalyzedFiles.filter(id => fileIdMap.has(id));
          
          if (validIds.length > 0) {
            setAnalyzedFileIds(validIds);
            setHasAnalysisResults(true);
            console.log('Set analyzed files from folder-specific cache:', validIds.length);
            return;
          }
        }
        
        // If no cache, get the data from the database
        const databaseFileIds = await resumeAnalysisService.getAnalyzedFilesInFolder(folderId);
        if (databaseFileIds.length > 0) {
          setAnalyzedFileIds(databaseFileIds);
          setHasAnalysisResults(true);
          
          // Update the folder-specific cache
          localStorage.setItem(folderAnalyzedFilesKey, JSON.stringify(databaseFileIds));
          console.log('Updated folder-specific cache with database results:', databaseFileIds.length);
        } else {
          // Check if we still have data in localStorage for this specific folder
          const storedResults = localStorage.getItem('resumeAnalysisResults');
          if (storedResults) {
            try {
              const allResults = JSON.parse(storedResults);
              const folderResults = allResults.filter((r: any) => r.folder_id === folderId);
              if (folderResults.length > 0) {
                const localStorageFileIds = folderResults
                  .filter((result: any) => result.file_id)
                  .map((result: any) => result.file_id);
                
                setAnalyzedFileIds(localStorageFileIds);
                setHasAnalysisResults(localStorageFileIds.length > 0);
                
                // Update the folder-specific cache
                localStorage.setItem(folderAnalyzedFilesKey, JSON.stringify(localStorageFileIds));
                console.log('Updated folder-specific cache with localStorage results:', localStorageFileIds.length);
              } else {
                setAnalyzedFileIds([]);
                setHasAnalysisResults(false);
              }
            } catch (parseError) {
              console.error('Error parsing localStorage results:', parseError);
              setAnalyzedFileIds([]);
              setHasAnalysisResults(false);
            }
          } else {
            setAnalyzedFileIds([]);
            setHasAnalysisResults(false);
          }
        }
      } catch (error) {
        console.error('Error refreshing analyzed file IDs:', error);
      }
    };
    
    // Setup visibility change listener to refresh when tab is focused
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When returning to the page, refresh the analyzed file IDs
        refreshAnalyzedFileIds();
      }
    };
    
    // Setup file analysis status change listener
    const handleFileAnalysisStatusChanged = (event: CustomEvent) => {
      const { fileId, isAnalyzed } = event.detail;
      
      if (isAnalyzed) {
        // Add file to analyzed files list if not already there
        setAnalyzedFileIds(prev => {
          if (prev.includes(fileId)) return prev;
          const newIds = [...prev, fileId];
          
          // Also update folder-specific cache
          const folderAnalyzedFilesKey = `analyzed_files_${folderId}`;
          localStorage.setItem(folderAnalyzedFilesKey, JSON.stringify(newIds));
          
          return newIds;
        });
        setHasAnalysisResults(true);
      } else {
        // Remove file from analyzed files list
        setAnalyzedFileIds(prev => {
          const newIds = prev.filter(id => id !== fileId);
          
          // Also update folder-specific cache
          const folderAnalyzedFilesKey = `analyzed_files_${folderId}`;
          localStorage.setItem(folderAnalyzedFilesKey, JSON.stringify(newIds));
          
          setHasAnalysisResults(newIds.length > 0);
          return newIds;
        });
      }
    };
    
    // Run initial refresh
    refreshAnalyzedFileIds();
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('fileAnalysisStatusChanged', handleFileAnalysisStatusChanged as EventListener);
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('fileAnalysisStatusChanged', handleFileAnalysisStatusChanged as EventListener);
    };
  }, [folderId, files]);

  // Filter folders based on search query when not in a folder
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle folder creation
  const handleCreateFolder = async (folderName: string) => {
    try {
      const newFolder = await documentsService.createFolder(folderName, TEMP_USER_ID);
      setFolders(prev => [newFolder, ...prev]);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  // Handle folder click to navigate
  const handleFolderClick = (folderId: string) => {
    navigate(`/documents/${folderId}`);
  };

  // Handle dropdown menu open
  const handleMoreClick = (e: React.MouseEvent, folder: FolderItem) => {
    e.stopPropagation();
    const button = e.currentTarget.getBoundingClientRect();
    setDropdownState({
      isOpen: true,
      folderId: folder.id,
      position: {
        top: button.bottom + window.scrollY - 28,
        right: window.innerWidth - button.right
      }
    });
    setSelectedFolder(folder);
  };

  // Handle folder rename
  const handleRename = async (newName: string) => {
    if (!selectedFolder) return;
    try {
      const updatedFolder = await documentsService.renameFolder(selectedFolder.id, newName);
      setFolders(prev => prev.map(folder => 
        folder.id === selectedFolder.id ? updatedFolder : folder
      ));
    } catch (error) {
      console.error('Error renaming folder:', error);
    }
  };

  // Handle folder delete
  const handleDelete = async () => {
    if (!selectedFolder) return;
    try {
      await documentsService.deleteFolder(selectedFolder.id, TEMP_USER_ID);
      setFolders(prev => prev.filter(folder => folder.id !== selectedFolder.id));
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File): Promise<void> => {
    if (!currentFolder) return;
    
    setUploading(true);
    
    try {
      // Upload single file
      const uploadedFile = await documentsService.uploadFile(
        file,
        currentFolder.id,
        TEMP_USER_ID
      );
      
      // Add successfully uploaded file to the state
      setFiles(prev => [uploadedFile, ...prev]);
    } catch (error) {
      // Check if this is a duplicate file error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('already exists in this folder')) {
        setUploadError(prevError => {
          const duplicateFile = file.name;
          if (!prevError) {
            return `**Duplicate file found:** ${duplicateFile}`;
          } else if (prevError.includes('**Duplicate file found:**')) {
            return `**Duplicate files found:** ${prevError.split('**Duplicate file found:** ')[1]}, ${duplicateFile}`;
          } else if (prevError.includes('**Duplicate files found:**')) {
            return `${prevError}, ${duplicateFile}`;
          }
          return prevError;
        });
      } else {
        // For other errors
        setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      }
      
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Handle upload completion
  const handleUploadComplete = () => {
    // Never automatically close the dialog - let the user close it manually
    // This ensures they can see errors, duplicates, or completed uploads
    // Keep the dialog open to maintain visual continuity
    
    // Refresh file list in the background
    if (folderId) {
      documentsService.getFiles(folderId)
        .then(updatedFiles => {
          setFiles(updatedFiles);
        })
        .catch(error => {
          console.error('Error refreshing files:', error);
        });
    }
  };

  // Handle file download
  const handleFileDownload = async (file: FileItem) => {
    try {
      const fileUrl = await documentsService.getFileUrl(file.url);
      
      // Fetch the file as a blob to force download
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Create a blob URL for the file
      const blobUrl = URL.createObjectURL(blob);
      
      // Create and click an anchor element to download the file
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Handle bulk file downloads as zip
  const handleBulkDownload = async () => {
    if (selectedFileIds.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      const zip = new JSZip();
      
      // For each selected file
      for (const fileId of selectedFileIds) {
        const file = files.find(f => f.id === fileId);
        if (!file) continue;
        
        const fileUrl = await documentsService.getFileUrl(file.url);
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        
        // Add file to zip
        zip.file(file.name, blob);
      }
      
      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Use file-saver to save the zip
      const folderName = currentFolder?.name || 'download';
      saveAs(zipBlob, `${folderName}-files.zip`);
      
    } catch (error) {
      console.error('Error creating zip download:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle file delete
  const handleFileDelete = (file: FileItem) => {
    setShowSingleDeleteConfirm(true);
    setFileToDelete(file);
  };

  // Handle file deletion confirmation
  const handleConfirmSingleDelete = async () => {
    if (!fileToDelete) return;
    
    setSingleDeleteLoading(true);
    try {
      // Delete the file from the database
      await documentsService.deleteFileById(fileToDelete.id);
      
      // Close the dialog first before any state updates to avoid UI freezing
      setShowSingleDeleteConfirm(false);
      
      // Remove the file from the list
      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      
      // If this file was analyzed, update the analyzed files list
      if (analyzedFileIds.includes(fileToDelete.id)) {
        setAnalyzedFileIds(prev => prev.filter(id => id !== fileToDelete.id));
      }
      
      // Clear the file to delete
      setFileToDelete(null);
      
      // Update the file list in the background without affecting analyzedFileIds
      if (folderId) {
        setTimeout(() => {
          documentsService.getFiles(folderId)
            .then(updatedFiles => {
              setFiles(updatedFiles);
            })
            .catch(error => {
              console.error('Error refreshing files:', error);
            });
        }, 500);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Still close the dialog even on error
      setShowSingleDeleteConfirm(false);
      setFileToDelete(null);
    } finally {
      setSingleDeleteLoading(false);
    }
  };

  // Handle bulk delete confirmation
  const handleConfirmBulkDelete = async () => {
    if (selectedFileIds.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      // Delete each selected file
      for (const fileId of selectedFileIds) {
        await documentsService.deleteFileById(fileId);
      }
      
      // Close the dialog first before any state updates
      setShowBulkDeleteConfirm(false);
      
      // Remove the deleted files from the list
      setFiles(prev => prev.filter(f => !selectedFileIds.includes(f.id)));
      
      // Only remove the deleted files from analyzedFileIds
      setAnalyzedFileIds(prev => prev.filter(id => !selectedFileIds.includes(id)));
      
      // Clear selection
      setSelectedFileIds([]);
      
      // Update the file list in the background without affecting analyzedFileIds
      if (folderId) {
        setTimeout(() => {
          documentsService.getFiles(folderId)
            .then(updatedFiles => {
              setFiles(updatedFiles);
            })
            .catch(error => {
              console.error('Error refreshing files:', error);
            });
        }, 500);
      }
    } catch (error) {
      console.error('Error deleting files:', error);
      // Still close the dialog even on error
      setShowBulkDeleteConfirm(false);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Select all files
  const selectAllFiles = () => {
    if (selectedFileIds.length === files.length) {
      // If all are selected, deselect all
      setSelectedFileIds([]);
    } else {
      // Otherwise, select all
      setSelectedFileIds(files.map(file => file.id));
    }
  };

  // Go back to folders view
  const handleBackToFolders = () => {
    setSelectedFileIds([]);
    navigate('/documents');
  };

  // Handle view analysis results
  const handleViewAnalysisResults = () => {
    // Always navigate to the results page
    // The results page will handle showing an empty state if there are no results
    if (folderId) {
      navigate('/resume-analysis-results');
    } else {
      navigate('/documents');
    }
  };

  // Open ATS Checker dialog
  const openATSChecker = () => {
    // If there are selected files, use those; otherwise use all files
    // This allows analyzing specific files when they are selected
    
    // Make sure we have at least one selected file or all files
    if (selectedFileIds.length === 0 && files.length > 0) {
      // If no files are selected, select all files by default
      setSelectedFileIds(files.map(file => file.id));
    }
    
    // Use the new DocumentAnalysisDialog
    setIsDocumentAnalysisOpen(true);
  };

  // Render folder dropdown menu
  const renderFolderMenu = () => {
    if (!dropdownState.isOpen) return null;

    return (
      <div
        ref={dropdownRef}
        style={{
          top: dropdownState.position.top,
          right: dropdownState.position.right,
        }}
        className="absolute z-50 bg-white rounded-md shadow-lg border border-gray-100 py-1 min-w-[105px]"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsRenameDialogOpen(true);
            setDropdownState(prev => ({ ...prev, isOpen: false }));
          }}
          className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 flex items-center gap-2"
        >
          <Pencil size={13} className="text-gray-600" />
          <span>Rename</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteDialogOpen(true);
            setDropdownState(prev => ({ ...prev, isOpen: false }));
          }}
          className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    );
  };

  // Render the UI based on whether we're viewing folder list or files in a folder
  return (
    <div className="space-y-8 -ml-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          {folderId ? (
            <div>
              <button
                onClick={handleBackToFolders}
                className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-2"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Folders
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                {currentFolder?.name || 'Loading...'}
              </h1>
              <p className="text-gray-500">Manage files in this folder</p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Documents</h1>
              <p className="text-gray-500">Manage your hiring phase folders and documents.</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* ATS Checker Button with glowing effect - only show in file list view */}
          {folderId && (
            <>
              <ATSCheckerButton 
                onClick={openATSChecker} 
              />
              
              {/* Analyze Results button - always show in folder view */}
              <button
                onClick={handleViewAnalysisResults}
                className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm"
              >
                <BarChart2 size={14} className="mr-1.5" />
                Analyze Results
              </button>
            </>
          )}

          {folderId ? (
            <>
            <button 
              onClick={() => setIsUploadDialogOpen(true)}
              className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm"
              disabled={loading}
            >
              <Upload size={14} className="mr-1.5" />
              <span>Upload Files</span>
            </button>
              
              {/* Only show bulk action buttons when at least one file is selected */}
              {selectedFileIds.length > 0 && (
                <>
                  <button 
                    onClick={handleBulkDownload}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors duration-200 flex items-center"
                    disabled={bulkActionLoading}
                    title="Download selected files"
                  >
                    <Download size={14} className="text-gray-600" />
                    {selectedFileIds.length > 0 && <span className="ml-1.5 text-gray-600">{selectedFileIds.length}</span>}
                  </button>
                  
                  <button 
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors duration-200 flex items-center"
                    disabled={bulkActionLoading}
                    title="Delete selected files"
                  >
                    <Trash2 size={14} className="text-gray-600" />
                    {selectedFileIds.length > 0 && <span className="ml-1.5 text-gray-600">{selectedFileIds.length}</span>}
                  </button>
                </>
              )}
            </>
          ) : (
            <button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm"
              disabled={loading}
            >
              <FolderPlus size={14} className="mr-1.5" />
              <span>New Folder</span>
            </button>
          )}
          
          {!folderId && (
            <>
              <button 
                onClick={() => setIsGridView(true)}
                className={`p-1.5 rounded-md transition-colors duration-200 ${
                  isGridView ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'
                }`}
                disabled={loading}
              >
                <Grid size={14} />
              </button>
              <button 
                onClick={() => setIsGridView(false)}
                className={`p-1.5 rounded-md transition-colors duration-200 ${
                  !isGridView ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'
                }`}
                disabled={loading}
              >
                <List size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search (only show for folder list view) */}
      {!folderId && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folders..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500 transition-colors duration-200"
            disabled={loading}
          />
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <DocumentsLoader />
      ) : (
        <>
          {/* Empty state for no folders */}
          {!folderId && folders.length === 0 && (
            <div className="bg-white rounded border border-gray-100 shadow-sm p-6 text-center">
              <FolderPlus size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-2">No folders found</p>
              <p className="text-gray-500 text-sm mb-4">Create a new folder to get started.</p>
              <button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors duration-200 inline-flex items-center shadow-sm"
              >
                <FolderPlus size={14} className="mr-1.5" />
                <span>New Folder</span>
              </button>
            </div>
          )}

          {/* Show file list when in a folder */}
          {folderId && (
            <>
              {/* Custom FileList with checkboxes for bulk selection */}
              <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-2.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center" style={{ paddingLeft: "20px" }}>
                    <CustomCheckbox 
                      checked={selectedFileIds.length === files.length && files.length > 0}
                      onChange={selectAllFiles}
                    />
                    <span className="ml-3 text-xs font-medium text-gray-700">
                      {selectedFileIds.length > 0 
                        ? `${selectedFileIds.length} selected` 
                        : 'Select files'
                      }
                    </span>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="pr-6 text-xs font-medium text-gray-600">
                      {files.length} {files.length === 1 ? 'file' : 'files'}
                    </div>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th style={{ paddingLeft: "40px" }} className="py-2 text-left w-12"></th>
                        <th className="py-2 text-left font-medium text-gray-500 uppercase tracking-wider pl-3">NAME</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">SIZE</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider pr-8">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {files.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-xs text-gray-500">
                            No files in this folder. Upload files to get started.
                          </td>
                        </tr>
                      ) : (
                        files.map((file) => (
                          <tr key={file.id} className={`hover:bg-gray-50 ${selectedFileIds.includes(file.id) ? 'bg-gray-50' : ''}`}>
                            <td style={{ paddingLeft: "30px" }} className="py-2.5 whitespace-nowrap">
                              <CustomCheckbox
                                checked={selectedFileIds.includes(file.id)}
                                onChange={() => toggleFileSelection(file.id)}
                              />
                            </td>
                            <td className="py-2.5 whitespace-nowrap pl-3">
                              <div className="flex items-center">
                                <span className="text-xs text-gray-800 font-medium truncate max-w-[200px]">{file.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <span className="text-xs text-gray-500">
                                {new Date(file.date).toLocaleDateString('en-US', { 
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-right pr-8">
                              <div className="flex justify-end space-x-3 items-center">
                                {analyzedFileIds.includes(file.id) && (
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/resume-analysis-results');
                                    }}
                                    className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded-full flex items-center border border-orange-200 font-medium hover:bg-orange-100 hover:border-orange-300 cursor-pointer transition-colors"
                                    title="View analysis results"
                                  >
                                    <CheckCircle size={10} className="mr-1 text-orange-500" />
                                    Analyzed
                                  </span>
                                )}
                                <button
                                  onClick={() => handleFileDownload(file)}
                                  className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                  title="Download"
                                >
                                  <Download size={15} />
                                </button>
                                <button
                                  onClick={() => handleFileDelete(file)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={15} />
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
            </>
          )}

          {/* Folders Grid/List (only when not in a folder) */}
          {!folderId && folders.length > 0 && (
            isGridView ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFolders.map(folder => (
                  <div 
                    key={folder.id}
                    onClick={() => handleFolderClick(folder.id)}
                    className="bg-white rounded border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-primary-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-50 rounded-lg">
                          <Folder size={20} className="text-primary-500" />
                        </div>
                        <div>
                          <h3 className="text-xs font-medium text-gray-800">{folder.name}</h3>
                          <p className="text-[10px] text-gray-500">
                            {new Date(folder.date).toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleMoreClick(e, folder)}
                        className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center text-[10px] text-gray-500">
                        <FileText size={14} className="mr-1.5" />
                        <span>{folder.files} files</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {filteredFolders.map(folder => (
                    <div 
                      key={folder.id}
                      onClick={() => handleFolderClick(folder.id)}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary-50 rounded-lg">
                          <Folder size={20} className="text-primary-500" />
                        </div>
                        <div>
                          <h3 className="text-xs font-medium text-gray-800">{folder.name}</h3>
                          <p className="text-[10px] text-gray-500">
                            {new Date(folder.date).toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-[10px] text-gray-500">
                          <FileText size={14} className="mr-1.5" />
                          <span>{folder.files} files</span>
                        </div>
                        <button 
                          onClick={(e) => handleMoreClick(e, folder)}
                          className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* Dropdown Menu */}
      {renderFolderMenu()}

      {/* Dialogs */}
      <CreateFolderDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateFolder}
      />
      
      {selectedFolder && (
        <>
          <RenameDialog
            isOpen={isRenameDialogOpen}
            onClose={() => setIsRenameDialogOpen(false)}
            onSubmit={handleRename}
            currentName={selectedFolder.name}
          />
          
          <DeleteConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDelete}
            folderName={selectedFolder.name}
          />
        </>
      )}

      {/* File Upload Dialog */}
      <FileUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => {
          setIsUploadDialogOpen(false);
          setUploadError(null);
        }}
        onUpload={handleFileUpload}
        isUploading={uploading}
        folderName={currentFolder?.name || ''}
        error={uploadError}
        maxSizeInMB={5}
        maxFilesInFolder={20}
        onClearError={() => setUploadError(null)}
        onComplete={handleUploadComplete}
      />

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          
          <div className="relative bg-white rounded shadow-xl w-full max-w-xs mx-4">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-900">Delete Multiple Files</h2>
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                disabled={bulkActionLoading}
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-red-50 rounded-full">
                  <AlertTriangle size={16} className="text-red-600" />
                </div>
                <p className="text-xs font-medium text-gray-900">Are you sure?</p>
              </div>
              
              <p className="text-xs text-gray-600 mb-3">
                This will permanently delete {selectedFileIds.length} {selectedFileIds.length === 1 ? 'file' : 'files'}. This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 focus:outline-none transition-colors"
                  disabled={bulkActionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBulkDelete}
                  disabled={bulkActionLoading}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none transition-colors"
                >
                  {bulkActionLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single File Delete Confirmation Dialog */}
      {showSingleDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          
          <div className="relative bg-white rounded shadow-xl w-full max-w-xs mx-4">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-900">Delete File</h2>
              <button
                onClick={() => {
                  if (!singleDeleteLoading) {
                    setShowSingleDeleteConfirm(false);
                    setFileToDelete(null);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                disabled={singleDeleteLoading}
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-red-50 rounded-full">
                  <AlertTriangle size={16} className="text-red-600" />
                </div>
                <p className="text-xs font-medium text-gray-900">Are you sure?</p>
              </div>
              
              <p className="text-xs text-gray-600 mb-3">
                This will permanently delete the file "{fileToDelete?.name}". This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!singleDeleteLoading) {
                      setShowSingleDeleteConfirm(false);
                      setFileToDelete(null);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 focus:outline-none transition-colors"
                  disabled={singleDeleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSingleDelete}
                  disabled={singleDeleteLoading}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none transition-colors"
                >
                  {singleDeleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Analysis Dialog (New multi-file analysis) */}
      {folderId && (
        <DocumentAnalysisDialog
          isOpen={isDocumentAnalysisOpen}
          onClose={() => setIsDocumentAnalysisOpen(false)}
          folderFiles={files}
          folderId={folderId}
          selectedFileIds={selectedFileIds}
        />
      )}
    </div>
  );
};

export default Documents; 