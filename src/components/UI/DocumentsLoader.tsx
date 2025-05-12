import React from 'react';
import LottieAnimation from './LottieAnimation';
import { DOT_LOADER_ANIMATION } from '../../utils/animationPreloader';

const DocumentsLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LottieAnimation 
        animationUrl={DOT_LOADER_ANIMATION} 
        width={80} 
        height={80} 
        className="opacity-75"
      />
    </div>
  );
};

export default DocumentsLoader; 