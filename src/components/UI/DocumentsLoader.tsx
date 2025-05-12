import React from 'react';
import LottieAnimation from './LottieAnimation';
import { DOT_LOADER_ANIMATION } from '../../utils/animationPreloader';

const DocumentsLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LottieAnimation 
        animationUrl={DOT_LOADER_ANIMATION} 
        width={60} 
        height={60}
      />
    </div>
  );
};

export default DocumentsLoader; 