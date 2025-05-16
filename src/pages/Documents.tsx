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
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import CreateFolderDialog from '../components/Dialogs/CreateFolderDialog';
import RenameDialog from '../components/Dialogs/RenameDialog';
import DeleteConfirmDialog from '../components/Dialogs/DeleteConfirmDialog';
import FileUploadDialog from '../components/Dialogs/FileUploadDialog';
import FileList from '../components/FileList';
import DocumentsLoader from '../components/UI/DocumentsLoader';
import { DocumentsService, FolderItem, FileItem } from '../services/documents.service';

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
  
  // Load folders or files based on route
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (folderId) {
          // Load files for a specific folder
          const folderFiles = await documentsService.getFiles(folderId);
          setFiles(folderFiles);
          
          // Get folder details
          const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('id', folderId)
            .single();
            
          if (error) throw error;
          setCurrentFolder(data);
        } else {
          // Load all folders for the user
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
  }, [folderId]);

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
  const handleFileUpload = async (files: File[]) => {
    if (!currentFolder) return;
    
    setUploading(true);
    setUploadError(null);
    
    try {
      for (const file of files) {
        const uploadedFile = await documentsService.uploadFile(
          file,
          currentFolder.id,
          TEMP_USER_ID
        );
        setFiles(prev => [uploadedFile, ...prev]);
      }
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload files');
      // Keep dialog open if there's an error
    } finally {
      setUploading(false);
    }
  };

  // Handle file download
  const handleFileDownload = async (file: FileItem) => {
    try {
      const fileUrl = await documentsService.getFileUrl(file.url);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Handle file delete
  const handleFileDelete = async (file: FileItem) => {
    if (!currentFolder) return;
    try {
      await documentsService.deleteFile(file.id, currentFolder.id, TEMP_USER_ID);
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // Go back to folders view
  const handleBackToFolders = () => {
    navigate('/documents');
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
        
        <div className="flex items-center space-x-2">
          {folderId ? (
            <button 
              onClick={() => setIsUploadDialogOpen(true)}
              className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-md hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm"
              disabled={loading}
            >
              <Upload size={14} className="mr-1.5" />
              <span>Upload Files</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-md hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm"
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
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-colors duration-200"
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
              <FolderPlus size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-2">No folders found</p>
              <p className="text-gray-500 text-sm mb-4">Create a new folder to get started.</p>
              <button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-md hover:bg-primary-600 transition-colors duration-200 inline-flex items-center shadow-sm"
              >
                <FolderPlus size={14} className="mr-1.5" />
                <span>New Folder</span>
              </button>
            </div>
          )}

          {/* Show file list when in a folder */}
          {folderId && (
            <FileList 
              files={files}
              onDownload={handleFileDownload}
              onDelete={handleFileDelete}
              isLoading={loading}
            />
          )}

          {/* Folders Grid/List (only when not in a folder) */}
          {!folderId && folders.length > 0 && (
            isGridView ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFolders.map(folder => (
                  <div 
                    key={folder.id}
                    onClick={() => handleFolderClick(folder.id)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-primary-200 hover:shadow-md transition-all duration-200"
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
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
      {currentFolder && (
        <FileUploadDialog
          isOpen={isUploadDialogOpen}
          onClose={() => {
            setIsUploadDialogOpen(false);
            setUploadError(null);
          }}
          onUpload={handleFileUpload}
          isUploading={uploading}
          folderName={currentFolder.name}
          error={uploadError}
          maxSizeInMB={5}
          maxFilesInFolder={20}
          onClearError={() => setUploadError(null)}
        />
      )}
    </div>
  );
};

export default Documents; 