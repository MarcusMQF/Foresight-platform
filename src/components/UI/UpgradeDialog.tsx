import React from 'react';
import Dialog from './Dialog';
import LottieAnimation from './LottieAnimation';
import { UPGRADE_DIALOG_ANIMATION } from '../../utils/animationPreloader';

// Preload animation will now be handled centrally by animationPreloader

interface UpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeDialog: React.FC<UpgradeDialogProps> = ({ isOpen, onClose }) => {
  // No need to preload here, it's handled in the main preloader
  
  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Upgrade to Premium"
      maxWidth="sm"
      closeOnOutsideClick={false}
      blurBackdrop={true}
    >
      <div className="text-center px-1">
        <div className="mx-auto w-29 h-29 flex items-center justify-center mb-3 -mt-6">
          <LottieAnimation 
            animationUrl={UPGRADE_DIALOG_ANIMATION} 
            width={150}
            height={150}
          />
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-1">Coming Soon!</h3>
        <p className="text-sm text-gray-600 mb-8 max-w-xs mx-auto">
          We're working hard to bring you premium features. 
          Stay tuned for updates!
        </p>
        
        <div className="flex space-x-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Maybe Later
          </button>
          <button 
            onClick={() => {
              // Here you could add notification subscription logic
              onClose();
            }}
            className="flex-1 py-2 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors duration-200"
          >
            Notify Me
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default UpgradeDialog; 