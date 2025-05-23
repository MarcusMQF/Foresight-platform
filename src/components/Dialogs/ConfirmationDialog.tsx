import React, { ReactNode } from 'react';
import { X, AlertTriangle } from 'lucide-react';

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
      
      <div className="relative bg-white rounded shadow-xl w-full max-w-xs mx-4">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-50"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-50 rounded-full">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <p className="text-xs font-medium text-gray-900">Are you sure?</p>
          </div>
          
          <p className="text-xs text-gray-600 mb-3">
            {message}
          </p>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors duration-200"
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