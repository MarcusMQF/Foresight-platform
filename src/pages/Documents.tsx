import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderPlus, 
  Grid, 
  List, 
  Search, 
  Folder,
  MoreVertical,
  FileText
} from 'lucide-react';
import CreateFolderDialog from '../components/Dialogs/CreateFolderDialog';

interface FolderItem {
  id: string;
  name: string;
  date: string;
  files: number;
}

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const [isGridView, setIsGridView] = useState(true);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folders, setFolders] = useState<FolderItem[]>([
    {
      id: 'software-engineer-2024',
      name: 'Software Engineer 2024',
      date: 'Jan 15, 2024',
      files: 12
    },
    {
      id: 'product-manager-2024',
      name: 'Product Manager 2024',
      date: 'Jan 10, 2024',
      files: 8
    },
    {
      id: 'ui-designer-2024',
      name: 'UI Designer 2024',
      date: 'Jan 5, 2024',
      files: 15
    }
  ]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateFolder = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newFolderName.trim()) {
      const newFolder: FolderItem = {
        id: newFolderName.toLowerCase().replace(/\s+/g, '-'),
        name: newFolderName,
        date: new Date().toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        files: 0
      };
      
      setFolders(prev => [newFolder, ...prev]);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const handleFolderClick = (folderId: string) => {
    navigate(`/documents/${folderId}`);
  };

  const handleCreateFolderDialog = (folderName: string) => {
    const newFolder: FolderItem = {
      id: folderName.toLowerCase().replace(/\s+/g, '-'),
      name: folderName,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      files: 0
    };
    
    setFolders(prev => [newFolder, ...prev]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Documents</h1>
          <p className="text-gray-500">Manage your hiring phase folders and documents.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-md hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm"
          >
            <FolderPlus size={14} className="mr-1.5" />
            <span>New Folder</span>
          </button>
          <button 
            onClick={() => setIsGridView(true)}
            className={`p-1.5 rounded-md transition-colors duration-200 ${
              isGridView ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid size={14} />
          </button>
          <button 
            onClick={() => setIsGridView(false)}
            className={`p-1.5 rounded-md transition-colors duration-200 ${
              !isGridView ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Search and New Folder Input */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search folders..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-colors duration-200"
          />
        </div>
        {showNewFolderInput && (
          <div className="flex-1">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleCreateFolder}
              placeholder="Enter folder name..."
              className="w-full px-4 py-2 bg-white border border-primary-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-colors duration-200"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Folders Grid/List */}
      {isGridView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {folders.map(folder => (
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
                    <h3 className="text-sm font-medium text-gray-800">{folder.name}</h3>
                    <p className="text-xs text-gray-500">{folder.date}</p>
                  </div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors duration-200">
                  <MoreVertical size={14} />
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500">
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
            {folders.map(folder => (
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
                    <h3 className="text-sm font-medium text-gray-800">{folder.name}</h3>
                    <p className="text-xs text-gray-500">{folder.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-xs text-gray-500">
                    <FileText size={14} className="mr-1.5" />
                    <span>{folder.files} files</span>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors duration-200">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateFolderDialog}
      />
    </div>
  );
};

export default Documents; 