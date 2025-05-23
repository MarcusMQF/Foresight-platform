import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Info, Folder, Archive, FileText, Loader } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  accept?: string;
  multiple?: boolean;
  maxSizeInMB?: number;
  maxFilesInFolder?: number;
  onClearError?: () => void;
  onComplete?: () => void;
}

interface FileStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onUpload, 
  isUploading, 
  accept = ".pdf",
  multiple = true,
  maxSizeInMB = 5,
  maxFilesInFolder = 20,
  onClearError,
  onComplete
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileStatus[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [folderSummary, setFolderSummary] = useState<{
    name: string;
    fileCount: number;
    totalSize: number;
    isValid: boolean;
    errorMessage?: string;
  } | null>(null);
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Process folder items from DataTransferItemList
  const processFolderItems = async (items: DataTransferItemList) => {
    // Reset folder summary when selecting a new folder
    setFolderSummary(null);
    
    // Use FileSystemDirectoryReader API to read folder contents
    const files: File[] = [];
    let folderName = 'Dropped Folder';
    let totalSize = 0;
    
    // Helper function to recursively read directories
    const readDirectory = async (entry: any, path = '') => {
      if (entry.isFile) {
        return new Promise<void>((resolve) => {
          entry.file((file: File) => {
            // Create a new file with the correct path
            const newFile = new File([file], path + file.name, { type: file.type });
            files.push(newFile);
            totalSize += file.size;
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        // If this is the top-level directory, set the folder name
        if (!path) {
          folderName = entry.name;
        }
        
        const dirReader = entry.createReader();
        
        // Read all entries in the directory
        const readEntries = () => {
          return new Promise<void>((resolve) => {
            dirReader.readEntries(async (entries: any[]) => {
              if (entries.length === 0) {
                resolve();
              } else {
                // Process all entries
                await Promise.all(entries.map(entry => 
                  readDirectory(entry, path + entry.name + '/')
                ));
                
                // Continue reading (readEntries only returns a batch)
                await readEntries();
                resolve();
              }
            });
          });
        };
        
        await readEntries();
      }
    };
    
    // Process all items that are directories
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry && entry.isDirectory) {
          await readDirectory(entry);
        }
      }
    }
    
    // Validate folder contents
    let isValid = true;
    let errorMessage = '';
    
    if (files.length > maxFilesInFolder) {
      isValid = false;
      errorMessage = `Folder contains ${files.length} files, but maximum allowed is ${maxFilesInFolder}`;
    }
    
    // Check if any file exceeds the size limit
    const oversizedFiles = files.filter(file => file.size > maxSizeInMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      isValid = false;
      errorMessage = `${oversizedFiles.length} file(s) exceed the ${maxSizeInMB}MB size limit`;
    }
    
    // Set folder summary
    if (files.length > 0) {
      setFolderSummary({
        name: folderName,
        fileCount: files.length,
        totalSize,
        isValid,
        errorMessage
      });
      
      // Only set files if folder is valid
      if (isValid) {
        validateAndSetFiles(files);
      } else {
        // Clear any previously selected files
        setSelectedFiles([]);
      }
    }
  };

  // Handle drop event
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Check if items contain directories
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      // Check if any of the items is a directory
      let hasDirectory = false;
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry && entry.isDirectory) {
            hasDirectory = true;
            break;
          }
        }
      }
      
      if (hasDirectory) {
        // Process as folder drop
        await processFolderItems(e.dataTransfer.items);
      } else if (e.dataTransfer.files.length > 0) {
        // Process as regular file drop
        const files = Array.from(e.dataTransfer.files);
        validateAndSetFiles(files);
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Fallback to regular file handling
      const files = Array.from(e.dataTransfer.files);
      validateAndSetFiles(files);
    }
  };

  // Trigger file input click
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Trigger folder input click
  const handleFolderButtonClick = () => {
    // Reset folder summary when selecting a new folder
    setFolderSummary(null);
    
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      validateAndSetFiles(files);
    }
  };

  // Handle folder input change
  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // Process folder information
      const folderPath = files[0].webkitRelativePath || '';
      const folderName = folderPath.split('/')[0] || 'Selected Folder';
      
      let totalSize = 0;
      files.forEach(file => {
        totalSize += file.size;
      });
      
      // Validate folder contents
      let isValid = true;
      let errorMessage = '';
      
      if (files.length > maxFilesInFolder) {
        isValid = false;
        errorMessage = `Folder contains ${files.length} files, but maximum allowed is ${maxFilesInFolder}`;
      }
      
      // Check if any file exceeds the size limit
      const oversizedFiles = files.filter(file => file.size > maxSizeInMB * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        isValid = false;
        errorMessage = `${oversizedFiles.length} file(s) exceed the ${maxSizeInMB}MB size limit`;
      }
      
      // Set folder summary
      setFolderSummary({
        name: folderName,
        fileCount: files.length,
        totalSize,
        isValid,
        errorMessage
      });
      
      // Only set files if folder is valid
      if (isValid) {
        validateAndSetFiles(files);
      } else {
        // Clear any previously selected files
        setSelectedFiles([]);
      }
    }
  };

  // Validate files before setting them
  const validateAndSetFiles = (files: File[]) => {
    const errors: {[key: string]: string} = {};
    const validFiles: FileStatus[] = [];
    
    files.forEach(file => {
      // Validate file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        errors[file.name] = `File exceeds maximum size of ${maxSizeInMB}MB`;
        return;
      }
      
      // Validate file type by extension - only allow PDF files
      const extension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['pdf'];
      
      if (!extension || !validExtensions.includes(extension)) {
        errors[file.name] = 'Only PDF files are supported';
        return;
      }
      
      validFiles.push({ file, status: 'pending' });
    });
    
    setValidationErrors(errors);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Clear selected files
  const clearFiles = () => {
    setSelectedFiles([]);
    setValidationErrors({});
    setFolderSummary(null);
    setCurrentUploadIndex(-1);
    
    // Clear any upload errors via the callback
    if (onClearError) {
      onClearError();
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  // Remove a specific file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const updatedFiles = [...prev];
      updatedFiles.splice(index, 1);
      return updatedFiles;
    });
  };

  // Submit selected files for upload
  const handleSubmit = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    
    try {
      // Start uploading files one by one
      setCurrentUploadIndex(0);
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < selectedFiles.length; i++) {
        // Skip files that are already uploaded or have errors
        if (selectedFiles[i].status === 'success') {
          successCount++;
          continue;
        }
        if (selectedFiles[i].status === 'error') {
          errorCount++;
          continue;
        }
        
        setCurrentUploadIndex(i);
        
        // Update status to uploading
        setSelectedFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'uploading' };
          return updated;
        });
        
        try {
          // Upload the file
          await onUpload(selectedFiles[i].file);
          
          // Update status to success
          setSelectedFiles(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], status: 'success' };
            return updated;
          });
          successCount++;
        } catch (error) {
          // Update status to error
          setSelectedFiles(prev => {
            const updated = [...prev];
            updated[i] = { 
              ...updated[i], 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            };
            return updated;
          });
          errorCount++;
        }
      }
      
      // Reset current upload index
      setCurrentUploadIndex(-1);
      
      // Only call onComplete if all files have been processed
      if (successCount + errorCount === selectedFiles.length && onComplete) {
        // Add a small delay to allow the UI to update and show the green status
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    } catch (error) {
      console.error('Error during upload process:', error);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get status icon for file
  const getStatusIcon = (status: FileStatus['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader size={14} className="text-primary-500 animate-spin" />;
      case 'success':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      case 'error':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-300 rounded-full"></div>;
    }
  };

  return (
    <div className="w-full">
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop PDF files here
        </p>
        <div className="flex justify-center gap-3 mb-2">
          <button
            type="button"
            onClick={handleFileButtonClick}
            className="text-primary-500 font-medium hover:text-primary-600 px-3 py-1 border border-primary-500 rounded text-xs inline-flex items-center focus:outline-none"
            disabled={isUploading}
          >
            <Upload size={12} className="mr-1" />
            Choose Files
          </button>
          <button
            type="button"
            onClick={handleFolderButtonClick}
            className="text-primary-500 font-medium hover:text-primary-600 px-3 py-1 border border-primary-500 rounded text-xs inline-flex items-center focus:outline-none"
            disabled={isUploading}
          >
            <Folder size={12} className="mr-1" />
            Choose Folder
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-1">
          Supported files: PDF only
        </p>
        <p className="text-xs text-gray-500">
          Maximum file size: {maxSizeInMB}MB
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
          disabled={isUploading}
        />
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFolderChange}
          accept={accept}
          multiple={multiple}
          // @ts-ignore: These attributes are necessary for folder upload but not in the TypeScript definition
          webkitdirectory=""
          directory=""
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Folder Summary */}
      {folderSummary && (
        <div className={`mt-3 p-3 border rounded-lg ${
          folderSummary.isValid 
            ? 'bg-orange-50 border-orange-100' 
            : 'bg-red-50 border-red-100'
        }`}>
          <div className="flex items-center">
            <div className={`p-1.5 rounded-lg mr-2 flex-shrink-0 ${
              folderSummary.isValid ? 'bg-orange-100' : 'bg-red-100'
            }`}>
              <Folder size={14} className={`${
                folderSummary.isValid ? 'text-orange-600' : 'text-red-600'
              }`} />
            </div>
            <div className="flex-1">
              <p className={`text-xs font-medium ${
                folderSummary.isValid ? 'text-orange-700' : 'text-red-700'
              }`}>
                {folderSummary.name}
              </p>
              
              <div className="mt-1 flex items-center gap-4">
                <span className={`flex items-center text-xs font-medium ${folderSummary.isValid ? 'text-orange-600' : 'text-red-600'}`}>
                  <FileText size={12} className={`mr-1.5 ${folderSummary.isValid ? 'text-orange-500' : 'text-red-500'}`} />
                  {folderSummary.fileCount} file{folderSummary.fileCount !== 1 ? 's' : ''}
                </span>
                <span className={`flex items-center text-xs font-medium ${folderSummary.isValid ? 'text-orange-600' : 'text-red-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-1.5 ${folderSummary.isValid ? 'text-orange-500' : 'text-red-500'}`}>
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  {formatFileSize(folderSummary.totalSize)}
                </span>
              </div>
              
              {!folderSummary.isValid && (
                <div className="flex items-center mt-1.5 text-xs text-red-600">
                  <AlertCircle size={12} className="text-red-500 mr-1 flex-shrink-0" />
                  <span>{folderSummary.errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center mb-1">
            <AlertCircle size={14} className="text-red-500 mr-1.5" />
            <p className="text-xs font-medium text-red-600">The following files could not be added:</p>
          </div>
          <ul className="ml-5 list-disc">
            {Object.entries(validationErrors).map(([fileName, error]) => (
              <li key={fileName} className="text-xs text-red-600 mt-1">
                {fileName}: {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Duplicate Detection Info - Only show when no files selected */}
      {selectedFiles.length === 0 && !folderSummary && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start">
            <Info size={14} className="text-blue-500 mt-0.5 mr-1.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Files will be checked for duplicates before upload. You'll be alerted if a file with the same name or similar content already exists.
            </p>
          </div>
        </div>
      )}

      {/* ZIP File and Folder Info - Only show when no files selected */}
      {selectedFiles.length === 0 && !folderSummary && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
          <div className="flex items-start">
            <Archive size={14} className="text-orange-500 mt-0.5 mr-1.5 flex-shrink-0" />
            <p className="text-xs font-medium text-orange-600">
              You can upload an entire folder (max {maxFilesInFolder} files) or a ZIP file. ZIP files will be automatically extracted after upload.
            </p>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected Files:</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((fileStatus, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-2 rounded-md ${
                  currentUploadIndex === index && fileStatus.status === 'uploading' 
                    ? 'bg-blue-50 border border-blue-100' 
                    : fileStatus.status === 'success'
                    ? 'bg-green-50 border border-green-100'
                    : fileStatus.status === 'error'
                    ? 'bg-red-50 border border-red-100'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="mr-2 flex-shrink-0">
                    {getStatusIcon(fileStatus.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">{fileStatus.file.name}</p>
                    <p className="text-[10px] text-gray-500">
                      {formatFileSize(fileStatus.file.size)}
                      {fileStatus.status === 'error' && (
                        <span className="text-red-500 ml-2">{fileStatus.error}</span>
                      )}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-gray-700 ml-2 focus:outline-none"
                  disabled={isUploading}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={clearFiles}
              className="px-3 py-1.5 text-xs text-gray-700 hover:text-gray-900 mr-2 focus:outline-none"
              disabled={isUploading}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || selectedFiles.length === 0}
              className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 