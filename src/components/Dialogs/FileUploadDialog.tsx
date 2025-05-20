import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
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
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">Upload Error</p>
                      <p className="text-xs text-red-600">{error}</p>
                      {error.includes('duplicate') || error.includes('similar') ? (
                        <p className="text-xs text-red-600 mt-1">
                          Please review existing files before uploading to avoid duplicates.
                        </p>
                      ) : null}
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
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default FileUploadDialog; 