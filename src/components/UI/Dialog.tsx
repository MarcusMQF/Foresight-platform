import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  closeOnOutsideClick?: boolean;
  blurBackdrop?: boolean;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  closeOnOutsideClick = false,
  blurBackdrop = false
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Close dialog when clicking outside (only if closeOnOutsideClick is true)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (closeOnOutsideClick && dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scrolling when dialog is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, closeOnOutsideClick]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  // Use createPortal to render the dialog at the document root level
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 ${
          blurBackdrop ? 'backdrop-blur-sm bg-black/30' : 'bg-black/50'
        }`}
      />
      
      {/* Dialog container */}
      <div className="fixed inset-0 flex items-center justify-center p-2">
        {/* Dialog */}
        <div 
          ref={dialogRef}
          className={`${maxWidthClasses[maxWidth]} w-full bg-white rounded-md shadow-xl z-50 relative overflow-hidden`}
          style={{ animation: 'dialogFadeIn 0.2s ease-out' }}
        >
          {/* Header with improved styling */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-medium text-gray-800">{title}</h3>
              {subtitle && (
                <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div>
              )}
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Content area with improved styling */}
          <div className="p-3">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Dialog; 