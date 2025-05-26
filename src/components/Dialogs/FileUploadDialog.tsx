import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { X, AlertCircle } from 'lucide-react';
import FileUpload, { FileUploadRef } from '../FileUpload';

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  folderName: string;
  error?: string | null;
  maxSizeInMB?: number;
  maxFilesInFolder?: number;
  onClearError?: () => void;
  onComplete?: () => void;
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
  onClearError,
  onComplete
}) => {
  const [uploading, setUploading] = useState(false);
  const [hasCompletedUploads, setHasCompletedUploads] = useState(false);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [preservedError, setPreservedError] = useState<string | null | undefined>(null);
  const [wasEverOpen, setWasEverOpen] = useState(false);
  
  // Reference to the FileUpload component to call its methods
  const fileUploadRef = useRef<FileUploadRef>(null);
  
  // Static key to ensure the FileUpload component isn't re-initialized on dialog close/open
  const uploadComponentKey = React.useMemo(() => 'persistent-file-upload', []);
  
  // Track if the dialog has ever been opened
  useEffect(() => {
    if (isOpen && !wasEverOpen) {
      setWasEverOpen(true);
    }
  }, [isOpen, wasEverOpen]);
  
  // Preserve error state when the dialog is opened
  useEffect(() => {
    if (isOpen) {
      if (error) {
        setPreservedError(error);
      }
    } else {
      // Clear error state when dialog is closed
      setPreservedError(null);
      if (onClearError) {
        onClearError();
      }
      
      // Clear selected files when dialog is closed
      if (fileUploadRef.current) {
        fileUploadRef.current.clearFiles();
      }
    }
  }, [isOpen, error, onClearError]);
  
  // Handle file upload
  const handleUpload = async (file: File): Promise<void> => {
    setUploading(true);
    // Add file to local state for persistence
    setLocalFiles(prevFiles => [...prevFiles, file]);
    
    try {
      await onUpload(file);
      setHasCompletedUploads(true);
    } catch (uploadError) {
      // Preserve error state locally
      if (uploadError instanceof Error) {
        setPreservedError(uploadError.message);
      } else {
        setPreservedError('Failed to upload file');
      }
      throw uploadError;
    } finally {
      setUploading(false);
    }
  };
  
  // Handle upload completion
  const handleUploadComplete = () => {
    // Only close the dialog if there are no errors
    if (onComplete) {
      onComplete();
    }
    
    // Do not automatically close the dialog - let the user close it manually
    // This ensures they can see errors or duplicates
  };
  
  // Handle close with confirmation if needed
  const handleClose = () => {
    // If uploads are in progress, confirm before closing
    if (uploading || isUploading) {
      if (window.confirm('Uploads are in progress. Are you sure you want to close this dialog?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };
  
  // Format error message for display
  const getErrorContent = () => {
    const currentError = preservedError || error;
    if (!currentError) return { title: '', message: '', isDuplicate: false };
    
    if (currentError.includes('**Duplicate file')) {
      // Extract the title part (Duplicate file(s) found)
      const isDuplicate = currentError.includes('**Duplicate files found:**');
      const title = isDuplicate ? 'Duplicate files found:' : 'Duplicate file found:';
      
      // Extract just the filenames without the prefix
      const message = currentError.replace(/\*\*Duplicate files? found:\*\*\s?/, '');
      
      return { title, message, isDuplicate: true };
    }
    
    // For other errors
    return { title: 'Upload Error', message: currentError, isDuplicate: false };
  };

  const errorContent = getErrorContent();
  const hasError = !!(preservedError || error);
  const hasDuplicates = hasError && errorContent.isDuplicate;
  const hasOtherErrors = hasError && !errorContent.isDuplicate;

  // Render the dialog content even when closed to preserve state
  const dialogContent = (
    <div className="mt-2">
      <FileUpload 
        ref={fileUploadRef}
        key={uploadComponentKey}
        onUpload={handleUpload}
        isUploading={isUploading || uploading}
        maxSizeInMB={maxSizeInMB}
        maxFilesInFolder={maxFilesInFolder}
        onClearError={() => {
          setPreservedError(null);
          if (onClearError) onClearError();
        }}
        onComplete={handleUploadComplete}
        persistState={true}
      />
    </div>
  );

  return (
    <>
      {/* Keep the component mounted even when dialog is closed to preserve state */}
      {wasEverOpen && !isOpen && (
        <div className="hidden">{dialogContent}</div>
      )}

      <Dialog 
        as="div" 
        className="relative z-50" 
        open={isOpen} 
        onClose={handleClose}
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium text-gray-900"
                >
                  Upload PDF Files to {folderName}
                </Dialog.Title>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <X size={18} />
                </button>
              </div>

              {hasDuplicates && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-start">
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

              {hasOtherErrors && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-start">
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

              {isOpen && dialogContent}
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default FileUploadDialog; 