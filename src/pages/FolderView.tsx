import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, X, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';

interface FileStatus {
  id: string;
  name: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
}

const FolderView: React.FC = () => {
  const { folderId } = useParams();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileStatus[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent | File[]) => {
    if (event instanceof Array) {
      processFiles(event);
      return;
    }

    event.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(event.dataTransfer.files));
  }, []);

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      const fileId = Math.random().toString(36).substring(7);
      
      setFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        status: 'pending'
      }]);

      setTimeout(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
            const isValidType = validTypes.includes(file.type);
            const isDuplicate = prev.some(existingFile => 
              existingFile.id !== fileId && existingFile.name === file.name && existingFile.status === 'success'
            );

            if (!isValidType) {
              return { ...f, status: 'error', message: 'Invalid file type' };
            }
            if (isDuplicate) {
              return { ...f, status: 'error', message: 'Duplicate file' };
            }
            return { ...f, status: 'success' };
          }
          return f;
        }));
      }, 1500);
    });
  };

  const handleFileClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.txt';
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      handleDrop(files);
    };
    input.click();
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusIcon = (status: FileStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500 animate-spin" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
            {folderId}
          </h1>
          <p className="text-gray-500">Upload and manage resumes for this hiring phase.</p>
        </div>
      </div>

      {/* Upload Area */}
      <div 
        className={`
          relative border-2 border-dashed rounded-xl p-8
          transition-colors duration-200 ease-in-out
          ${isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-200 hover:border-primary-500 hover:bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileClick}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload 
            size={32} 
            className={`
              mb-4 transition-colors duration-200
              ${isDragging ? 'text-primary-500' : 'text-gray-400'}
            `}
          />
          <p className="text-sm font-medium text-gray-800 mb-1">
            Drag & drop resumes here, or click to select files
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: PDF, DOC, DOCX, TXT (Max 10 files, 5MB each)
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-800">Uploaded Files</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {files.map(file => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <FileText size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{file.name}</p>
                    {file.message && (
                      <p className="text-xs text-red-500">{file.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(file.status)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderView; 