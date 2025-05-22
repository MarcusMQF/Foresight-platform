import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: ReactNode;
  cancelText?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <h2 className="text-base font-normal text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start mb-3">
            <div className="mr-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#FEE2E2"/>
                <path d="M8 4C8.55228 4 9 4.44772 9 5V8C9 8.55228 8.55228 9 8 9C7.44772 9 7 8.55228 7 8V5C7 4.44772 7.44772 4 8 4Z" fill="#EF4444"/>
                <path d="M8 12C8.55228 12 9 11.5523 9 11C9 10.4477 8.55228 10 8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12Z" fill="#EF4444"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Are you sure?</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-normal rounded hover:bg-gray-50 transition-colors duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-1.5 text-white text-sm font-normal rounded transition-colors duration-200 bg-red-500 hover:bg-red-600"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 