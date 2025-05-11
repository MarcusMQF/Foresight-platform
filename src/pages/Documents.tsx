import React from 'react';
import { FileText, Upload, FolderPlus, Search, Grid, List, MoreVertical, ChevronRight } from 'lucide-react';

const Documents: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Documents</h1>
          <p className="text-gray-500">Manage and organize your files and documents.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center shadow-sm">
            <Upload size={14} className="mr-1.5" />
            <span>Upload</span>
          </button>
          <button className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-md hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm">
            <FolderPlus size={14} className="mr-1.5" />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      {/* Search and View Options */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-primary-500 transition-colors duration-200"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200">
            <Grid size={16} />
          </button>
          <button className="p-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors duration-200">
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Project Proposal', type: 'PDF', size: '2.4 MB', modified: '2 hours ago' },
          { name: 'Meeting Notes', type: 'DOC', size: '1.8 MB', modified: '5 hours ago' },
          { name: 'Financial Report', type: 'XLS', size: '3.2 MB', modified: '1 day ago' },
          { name: 'Design Assets', type: 'ZIP', size: '15.7 MB', modified: '2 days ago' },
          { name: 'Client Presentation', type: 'PPT', size: '5.1 MB', modified: '3 days ago' },
          { name: 'Marketing Plan', type: 'PDF', size: '4.3 MB', modified: '1 week ago' },
        ].map((doc, index) => (
          <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <FileText size={20} className="text-primary-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{doc.name}</h3>
                  <p className="text-xs text-gray-500">{doc.type} • {doc.size}</p>
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors duration-200">
                <MoreVertical size={16} />
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Modified {doc.modified}</span>
              <button className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center">
                Open
                <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Documents; 