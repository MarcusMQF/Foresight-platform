import React from 'react';
import { Award, Briefcase, FileText, Star, ThumbsUp, AlertTriangle, Loader2 } from 'lucide-react';
import QualificationBadge from './QualificationBadge';

interface HRAssessmentProps {
  hrAnalysis?: {
    overall?: string;
    technical?: string;
    cultural?: string;
    experience?: string;
  };
  hrAssessment?: {
    rating?: number;
    status?: 'qualified' | 'partially_qualified' | 'not_qualified';
    strengths?: string[];
    weaknesses?: string[];
  };
  hrRecommendations?: string[];
  isLoading?: boolean;
}

const HRAssessment: React.FC<HRAssessmentProps> = ({
  hrAnalysis = {},
  hrAssessment = {},
  hrRecommendations = [],
  isLoading = false
}) => {
  // Generate star rating (1-5)
  const renderRating = () => {
    const rating = hrAssessment.rating || 0;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i}
          size={14} 
          className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} 
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // If data is loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-md flex items-center justify-center">
        <Loader2 size={18} className="text-primary-500 animate-spin mr-2" />
        <span className="text-xs text-gray-600">Generating HR assessment...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HR Analysis Section */}
      {Object.keys(hrAnalysis).length > 0 && (
        <div>
          <div className="bg-gray-50 p-3 rounded-md space-y-2">
            {hrAnalysis.overall && (
              <div className="text-xs text-gray-800">
                <span className="font-medium">Overall:</span> {hrAnalysis.overall}
              </div>
            )}
            {hrAnalysis.technical && (
              <div className="text-xs text-gray-800">
                <span className="font-medium">Technical Skills:</span> {hrAnalysis.technical}
              </div>
            )}
            {hrAnalysis.cultural && (
              <div className="text-xs text-gray-800">
                <span className="font-medium">Cultural Fit:</span> {hrAnalysis.cultural}
              </div>
            )}
            {hrAnalysis.experience && (
              <div className="text-xs text-gray-800">
                <span className="font-medium">Experience:</span> {hrAnalysis.experience}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HR Assessment Section */}
      {(hrAssessment.strengths?.length || hrAssessment.weaknesses?.length) && (
        <div>
          <div className="bg-gray-50 p-3 rounded-md space-y-2">
            {/* Status and Rating */}
            <div className="flex items-center justify-between mb-2">
              {hrAssessment.status && (
                <QualificationBadge status={hrAssessment.status} />
              )}
              {hrAssessment.rating !== undefined && renderRating()}
            </div>

            {/* Strengths */}
            {hrAssessment.strengths && hrAssessment.strengths.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Strengths:</div>
                <div className="space-y-1">
                  {hrAssessment.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-start text-xs">
                      <ThumbsUp size={12} className="text-green-500 mt-0.5 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-800">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {hrAssessment.weaknesses && hrAssessment.weaknesses.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Areas for Improvement:</div>
                <div className="space-y-1">
                  {hrAssessment.weaknesses.map((weakness, idx) => (
                    <div key={idx} className="flex items-start text-xs">
                      <AlertTriangle size={12} className="text-yellow-500 mt-0.5 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-800">{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HR Recommendations */}
      {hrRecommendations && hrRecommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-1">HR Recommendations</h4>
          <div className="bg-blue-50 p-3 rounded-md space-y-2">
            {hrRecommendations.map((recommendation, idx) => (
              <div key={idx} className="flex items-start text-xs">
                <Briefcase size={12} className="text-blue-500 mt-0.5 mr-1.5 flex-shrink-0" />
                <span className="text-blue-800">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAssessment; 