import React from 'react';
import { AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';

interface MatchScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({ 
  score, 
  size = 'md',
  showText = true
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreGlow = (score: number) => {
    if (score >= 80) return 'shadow-green-100/50';
    if (score >= 60) return 'shadow-orange-100/50';
    return 'shadow-red-100/50';
  };

  const getScoreIcon = (score: number) => {
    const iconSize = size === 'sm' ? 10 : size === 'md' ? 14 : 18;
    const marginRight = size === 'sm' ? 'mr-1' : 'mr-1.5';
    
    if (score >= 80) {
      const colorClass = 'text-green-600';
      return <CheckCircle size={iconSize} className={`${marginRight} ${colorClass}`} />;
    }
    if (score >= 60) {
      const colorClass = 'text-orange-600';
      return <BarChart2 size={iconSize} className={`${marginRight} ${colorClass}`} />;
    }
    const colorClass = 'text-red-600';
    return <AlertTriangle size={iconSize} className={`${marginRight} ${colorClass}`} />;
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return "Strong match";
    if (score >= 60) return "Moderate match";
    return "Weak match";
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-1.5 py-0.5 text-[10px]';
      case 'lg':
        return 'px-3 py-2 text-sm';
      case 'md':
      default:
        return 'px-2.5 py-1.5 text-xs';
    }
  };

  return (
    <div 
      className={`inline-flex items-center rounded-full font-medium ${getScoreColor(score)} ${getSizeClasses()} border transition-all duration-300`}
      title={getScoreText(score)}
    >
      {getScoreIcon(score)}
      {showText && `${score}%`}
    </div>
  );
};

export default MatchScoreBadge; 