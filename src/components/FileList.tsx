import React, { useState } from 'react';
import { 
  FileText, 
  MoreVertical, 
  Download, 
  Trash2, 
  FileImage,
  FileArchive,
  FileVideo,
  FileSpreadsheet,
  FilePieChart,
  File
} from 'lucide-react';
import { FileItem } from '../services/documents.service';

interface FileListProps {
  files: FileItem[];
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  isLoading: boolean;
}

const FileList: React.FC<FileListProps> = ({ files, onDownload, onDelete, isLoading }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  if (isLoading) {
    return null;
  }

  // Format file size to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) {
      return <FileImage size={18} className="text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <FilePieChart size={18} className="text-red-500" />;
    } else if (fileType.includes('video')) {
      return <FileVideo size={18} className="text-purple-500" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
      return <FileSpreadsheet size={18} className="text-green-500" />;
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) {
      return <FileArchive size={18} className="text-amber-500" />;
    } else if (fileType.includes('text') || fileType.includes('doc')) {
      return <FileText size={18} className="text-gray-500" />;
    }
    return <File size={18} className="text-gray-500" />;
  };

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Toggle dropdown menu
  const toggleMenu = (fileId: string) => {
    setActiveMenu(activeMenu === fileId ? null : fileId);
  };

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-gray-500">No files uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getFileIcon(file.type)}
                  <span className="ml-3 text-sm text-gray-800">{file.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-600">{formatFileSize(file.size)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-600">{formatDate(file.date)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="relative inline-block">
                  <button
                    onClick={() => toggleMenu(file.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {activeMenu === file.id && (
                    <div className="absolute right-0 mt-1 z-10 w-36 bg-white rounded-md shadow-lg border border-gray-100 py-1">
                      <button
                        onClick={() => {
                          onDownload(file);
                          setActiveMenu(null);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Download size={13} className="text-gray-600" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => {
                          onDelete(file);
                          setActiveMenu(null);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileList; 