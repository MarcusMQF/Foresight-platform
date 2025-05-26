import React from 'react';
import { Award, Briefcase, FileText, Star, ThumbsUp, AlertTriangle, Loader2 } from 'lucide-react';

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
  // Helper function to get status color and icon
  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'qualified':
        return { color: 'text-green-600', bgColor: 'bg-green-50', icon: <ThumbsUp size={14} className="mr-1.5" /> };
      case 'partially_qualified':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: <Star size={14} className="mr-1.5" /> };
      case 'not_qualified':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: <AlertTriangle size={14} className="mr-1.5" /> };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: <FileText size={14} className="mr-1.5" /> };
    }
  };

  // Get status display information
  const statusInfo = getStatusInfo(hrAssessment.status);

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
      {(hrAssessment.rating !== undefined || hrAssessment.status || 
        hrAssessment.strengths?.length || hrAssessment.weaknesses?.length) && (
        <div>
          <div className="bg-gray-50 p-3 rounded-md space-y-2">
            {/* Status and Rating */}
            <div className="flex items-center justify-between mb-2">
              {hrAssessment.status && (
                <div className={`flex items-center text-xs ${statusInfo.color} px-2 py-1 rounded ${statusInfo.bgColor}`}>
                  {statusInfo.icon}
                  <span className="capitalize">{hrAssessment.status.replace(/_/g, ' ')}</span>
                </div>
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