import React from 'react';
import { Dialog } from '@headlessui/react';
import { X, AlertCircle } from 'lucide-react';
import FileUpload from '../FileUpload';

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  folderName: string;
  error?: string | null;
  maxSizeInMB?: number;
  maxFilesInFolder?: number;
  onClearError?: () => void;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
  isUploading,
  folderName,
  error,
  maxSizeInMB = 5,
  maxFilesInFolder = 20,
  onClearError
}) => {
  // Create a handler for clearing errors
  const handleClearError = () => {
    if (onClearError) {
      onClearError();
    }
  };
  
  // Format error message for display
  const getErrorContent = () => {
    if (!error) return { title: '', message: '' };
    
    if (error.includes('**Duplicate file')) {
      // Extract the title part (Duplicate file(s) found)
      const isDuplicate = error.includes('**Duplicate files found:**');
      const title = isDuplicate ? 'Duplicate files found:' : 'Duplicate file found:';
      
      // Extract just the filenames without the prefix
      const message = error.replace(/\*\*Duplicate files? found:\*\*\s?/, '');
      
      return { title, message };
    }
    
    // For other errors
    return { title: 'Upload Error', message: error };
  };

  const errorContent = getErrorContent();

  return (
    <Dialog 
      as="div" 
      className="relative z-50" 
      open={isOpen} 
      onClose={onClose}
    >
      <div className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium text-gray-900"
              >
                Upload PDF Files to {folderName}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start">
                <AlertCircle size={14} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="w-full overflow-hidden">
                  <p className="text-xs font-medium text-red-600 mb-1">
                    <span className="font-bold">{errorContent.title}</span>
                  </p>
                  <p className="text-xs text-red-600 break-words max-h-16 overflow-y-auto pr-1">
                    {errorContent.message}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-2">
              <FileUpload 
                onUpload={onUpload} 
                isUploading={isUploading}
                maxSizeInMB={maxSizeInMB}
                maxFilesInFolder={maxFilesInFolder}
                onClearError={handleClearError}
              />
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default FileUploadDialog; 