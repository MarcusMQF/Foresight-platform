import React from 'react';
import { CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import MatchScoreBadge from './MatchScoreBadge';

interface AnalyzedFileBadgeProps {
  fileId: string;
  showScore?: boolean;
}

const AnalyzedFileBadge: React.FC<AnalyzedFileBadgeProps> = ({ fileId, showScore = true }) => {
  const navigate = useNavigate();
  const [score, setScore] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [matchCount, setMatchCount] = React.useState<number>(0);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const badgeRef = React.useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: true });

  React.useEffect(() => {
    const fetchScore = async () => {
      try {
        const { data, error } = await supabase
          .from('analysis_results')
          .select('match_score, strengths')
          .eq('file_id', fileId)
          .single();

        if (error) {
          console.error('Error fetching score:', error);
        } else if (data) {
          setScore(data.match_score);
          
          // Extract matched keywords count
          if (data.strengths) {
            try {
              const strengths = typeof data.strengths === 'string' 
                ? JSON.parse(data.strengths) 
                : data.strengths;
              
              setMatchCount(Array.isArray(strengths) ? strengths.length : 0);
            } catch (e) {
              console.error('Error parsing strengths:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchScore:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScore();
  }, [fileId]);

  // Check if there's enough space above the element to show the tooltip
  React.useEffect(() => {
    if (showTooltip && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      // If the distance from the top of the viewport is less than the tooltip height (approx 100px)
      // then show the tooltip below instead of above
      setTooltipPosition({ top: rect.top > 120 });
    }
  }, [showTooltip]);

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Strong match';
    if (score >= 60) return 'Moderate match';
    return 'Weak match';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/resume-analysis-results');
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Use a pulse animation when loading
  if (isLoading) {
    return (
      <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] rounded-full flex items-center border border-gray-200 font-medium animate-pulse">
        <TrendingUp size={10} className="mr-1 text-gray-400" />
        Analyzing...
      </span>
    );
  }

  if (score === null) {
    return (
      <span 
        onClick={handleClick}
        className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded-full flex items-center border border-orange-200 font-medium hover:bg-orange-100 hover:border-orange-300 cursor-pointer transition-colors"
        title="View analysis results"
      >
        <CheckCircle size={10} className="mr-1 text-orange-500" />
        Analyzed
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <div 
        ref={badgeRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer"
        title={`Match score: ${score}%. Click to view analysis results.`}
      >
        <div className="flex items-center">
          <MatchScoreBadge score={score} size="sm" />
          {matchCount > 0 && <span className="ml-1 text-[8px] text-gray-500">• {matchCount} kw</span>}
        </div>
      </div>

      {/* Enhanced tooltip */}
      {showTooltip && (
        <div 
          ref={tooltipRef}
          className="fixed z-[9999] bg-white text-gray-800 p-2 rounded shadow-lg border border-gray-200 text-xs w-48"
          style={{
            top: tooltipPosition.top ? 
              badgeRef.current ? badgeRef.current.getBoundingClientRect().top - 110 : 'auto' : 
              badgeRef.current ? badgeRef.current.getBoundingClientRect().bottom + 10 : 'auto',
            left: badgeRef.current ? 
              badgeRef.current.getBoundingClientRect().left + (badgeRef.current.getBoundingClientRect().width / 2) - 96 : 'auto',
          }}
        >
          <div className="font-medium text-center mb-1">{getScoreText(score)}</div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-600">Match Score:</span>
            <span className="font-medium">{score}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Matched Keywords:</span>
            <span className="font-medium">{matchCount}</span>
          </div>
          <div className="text-center mt-1 pt-1 border-t border-gray-100 text-primary-600 text-[10px]">
            Click to view full analysis
          </div>
          {/* Arrow pointing in the appropriate direction */}
          <div 
            className={`absolute h-2 w-2 bg-white transform rotate-45 left-1/2 -ml-1 ${
              tooltipPosition.top ? 'bottom-[-4px] border-r border-b' : 'top-[-4px] border-l border-t'
            } border-gray-200`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default AnalyzedFileBadge; 