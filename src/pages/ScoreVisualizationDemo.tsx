import React from 'react';
import RadarChart from '../components/RadarChart';
import MultiRadarCharts from '../components/MultiRadarCharts';
import { 
  createScoreCategories, 
  createMultiCandidateRadarData 
} from '../utils/scoreUtils';

const ScoreVisualizationDemo: React.FC = () => {
  // Example data for a single radar chart
  const singleChartData = createScoreCategories({
    'Technical Skills': 85,
    'Communication': 70,
    'Problem Solving': 90,
    'Teamwork': 75,
    'Leadership': 65
  });

  // Example data for multiple radar charts
  const candidateScores = {
    'Candidate A': {
      'Technical Skills': 85,
      'Communication': 70,
      'Problem Solving': 90,
      'Teamwork': 75,
      'Leadership': 65
    },
    'Candidate B': {
      'Technical Skills': 75,
      'Communication': 85,
      'Problem Solving': 70,
      'Teamwork': 90,
      'Leadership': 80
    },
    'Candidate C': {
      'Technical Skills': 90,
      'Communication': 60,
      'Problem Solving': 85,
      'Teamwork': 65,
      'Leadership': 70
    },
    'Candidate D': {
      'Technical Skills': 65,
      'Communication': 80,
      'Problem Solving': 75,
      'Teamwork': 85,
      'Leadership': 90
    },
    'Candidate E': {
      'Technical Skills': 80,
      'Communication': 75,
      'Problem Solving': 80,
      'Teamwork': 80,
      'Leadership': 75
    },
    'Candidate F': {
      'Technical Skills': 70,
      'Communication': 90,
      'Problem Solving': 65,
      'Teamwork': 70,
      'Leadership': 85
    }
  };

  const multipleChartsData = createMultiCandidateRadarData(candidateScores);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-6 text-center">Score Visualization</h1>
        
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Single Radar Chart Example</h2>
          <div className="max-w-md mx-auto">
            <RadarChart 
              data={singleChartData} 
              maxValue={100} 
              title="Candidate Profile"
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Multiple Radar Charts Comparison</h2>
          <p className="text-gray-600 mb-6">
            Compare score breakdowns across multiple candidates or categories.
          </p>
          <MultiRadarCharts 
            charts={multipleChartsData} 
            maxValue={100}
          />
        </div>
      </div>
    </div>
  );
};

export default ScoreVisualizationDemo; 