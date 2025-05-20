import React from 'react';
import { Zap } from 'lucide-react';

interface ATSCheckerButtonProps {
  onClick: () => void;
  className?: string;
}

const ATSCheckerButton: React.FC<ATSCheckerButtonProps> = ({
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`${className} transition-all duration-300`}
    >
      <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded shadow-lg transition-all duration-300 hover:shadow-xl hover:brightness-110">
        <Zap size={14} className="mr-1.5 animate-pulse" />
        <span>ATS Checker</span>
      </div>
    </button>
  );
};

export default ATSCheckerButton; 