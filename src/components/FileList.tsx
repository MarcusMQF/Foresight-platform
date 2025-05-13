import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  FileText, 
  MoreVertical, 
  Download, 
  Trash2, 
  FileArchive,
  FileVideo,
  FileSpreadsheet,
  File
} from 'lucide-react';
import { FileItem } from '../services/documents.service';
import pdfIcon from '../assets/images/pdf.png';
import docxIcon from '../assets/images/docx.png';
import pngIcon from '../assets/images/png-file.png';

interface FileListProps {
  files: FileItem[];
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  isLoading: boolean;
}

// DropdownMenu component that portals to the body
const DropdownMenu = ({ 
  file, 
  buttonRef, 
  onDownload, 
  onDelete, 
  onClose 
}: { 
  file: FileItem; 
  buttonRef: React.RefObject<HTMLButtonElement>; 
  onDownload: (file: FileItem) => void; 
  onDelete: (file: FileItem) => void; 
  onClose: () => void;
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buttonRef.current && menuRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.right;
      
      // Position the menu
      let top = rect.bottom + window.scrollY;
      let left = rect.right - menuRect.width + window.scrollX;
      
      // Adjust if too close to bottom
      if (spaceBelow < menuRect.height && rect.top > menuRect.height) {
        top = rect.top - menuRect.height + window.scrollY;
      }
      
      // Adjust if too close to right edge
      if (spaceRight < menuRect.width) {
        left = rect.left + window.scrollX;
      }
      
      setPosition({ top, left });
    }
  }, [buttonRef]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, buttonRef]);

  return ReactDOM.createPortal(
    <div 
      ref={menuRef}
      className="fixed z-50 w-36 bg-white rounded-md shadow-lg border border-gray-100 py-1"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`
      }}
    >
      <button
        onClick={() => {
          onDownload(file);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 flex items-center gap-2"
      >
        <Download size={13} className="text-gray-600" />
        <span>Download</span>
      </button>
      <button
        onClick={() => {
          onDelete(file);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
      >
        <Trash2 size={13} />
        <span>Delete</span>
      </button>
    </div>,
    document.body
  );
};

const FileList: React.FC<FileListProps> = ({ files, onDownload, onDelete, isLoading }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const buttonRefs = useRef<{ [key: string]: React.RefObject<HTMLButtonElement> }>({});
  
  // Initialize refs for buttons
  useEffect(() => {
    files.forEach(file => {
      if (!buttonRefs.current[file.id]) {
        buttonRefs.current[file.id] = React.createRef<HTMLButtonElement>();
      }
    });
  }, [files]);

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
      return <img src={pngIcon} alt="PNG" className="w-[18px] h-[18px]" />;
    } else if (fileType.includes('pdf')) {
      return <img src={pdfIcon} alt="PDF" className="w-[18px] h-[18px]" />;
    } else if (fileType.includes('doc') || fileType.includes('word')) {
      return <img src={docxIcon} alt="DOCX" className="w-[18px] h-[18px]" />;
    } else if (fileType.includes('video')) {
      return <FileVideo size={18} className="text-purple-500" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
      return <FileSpreadsheet size={18} className="text-green-500" />;
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) {
      return <FileArchive size={18} className="text-amber-500" />;
    } else if (fileType.includes('text')) {
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
                    ref={buttonRefs.current[file.id]}
                    onClick={() => toggleMenu(file.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {activeMenu === file.id && buttonRefs.current[file.id] && (
                    <DropdownMenu
                      file={file}
                      buttonRef={buttonRefs.current[file.id]}
                      onDownload={onDownload}
                      onDelete={onDelete}
                      onClose={() => setActiveMenu(null)}
                    />
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