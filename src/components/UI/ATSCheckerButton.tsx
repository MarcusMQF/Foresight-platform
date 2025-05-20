import React, { useState } from 'react';
import { Zap } from 'lucide-react';

interface ATSCheckerButtonProps {
  onClick: () => void;
  className?: string;
}

const ATSCheckerButton: React.FC<ATSCheckerButtonProps> = ({
  onClick,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <div 
        className={`absolute inset-0 rounded bg-gradient-to-r from-blue-400 to-purple-500 opacity-75 blur-md transition-all duration-300 
        ${isHovered ? 'scale-110 opacity-100' : 'scale-100'}`}
      />
      
      {/* Button content */}
      <div className="relative z-10 flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded shadow-lg transition-all duration-300 hover:shadow-xl">
        <Zap size={14} className="mr-1.5 animate-pulse" />
        <span>ATS Checker</span>
      </div>
    </button>
  );
};

export default ATSCheckerButton; 