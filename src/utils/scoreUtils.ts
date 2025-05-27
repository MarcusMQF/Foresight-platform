import { ScoreCategory } from '../components/RadarChart';
import { RadarChartData } from '../components/MultiRadarCharts';

/**
 * Creates a set of standardized score categories
 * @param scores Object containing score values for each category
 * @returns Array of ScoreCategory objects for use with RadarChart
 */
export const createScoreCategories = (scores: {
  [key: string]: number;
}): ScoreCategory[] => {
  const categories: ScoreCategory[] = [];
  
  for (const [name, value] of Object.entries(scores)) {
    categories.push({ name, value });
  }
  
  return categories;
};

/**
 * Standard color schemes for radar charts
 */
export const radarChartColors = [
  { borderColor: 'rgb(53, 162, 235)', backgroundColor: 'rgba(53, 162, 235, 0.2)' },
  { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)' },
  { borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.2)' },
  { borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)' },
  { borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)' },
  { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)' }
];

/**
 * Creates radar chart data for a candidate's score breakdown
 * @param candidateId ID or name of the candidate
 * @param scores Object containing score values for each category
 * @param colorIndex Index of the color scheme to use
 * @returns RadarChartData object ready for use with MultiRadarCharts
 */
export const createCandidateRadarData = (
  candidateId: string,
  scores: { [key: string]: number },
  colorIndex: number = 0
): RadarChartData => {
  return {
    title: candidateId,
    categories: createScoreCategories(scores),
    colorScheme: radarChartColors[colorIndex % radarChartColors.length]
  };
};

/**
 * Creates an array of radar chart data for multiple candidates
 * @param candidatesScores Object mapping candidate IDs to their score objects
 * @returns Array of RadarChartData objects ready for use with MultiRadarCharts
 */
export const createMultiCandidateRadarData = (
  candidatesScores: { [candidateId: string]: { [category: string]: number } }
): RadarChartData[] => {
  return Object.entries(candidatesScores).map(([candidateId, scores], index) => 
    createCandidateRadarData(candidateId, scores, index)
  );
};

/**
 * Normalizes scores to ensure they're within a specific range
 * @param scores Original scores object
 * @param minValue Minimum value for normalized scores
 * @param maxValue Maximum value for normalized scores
 * @returns Object with normalized scores
 */
export const normalizeScores = (
  scores: { [key: string]: number },
  minValue: number = 0,
  maxValue: number = 100
): { [key: string]: number } => {
  const normalizedScores: { [key: string]: number } = {};
  
  for (const [category, score] of Object.entries(scores)) {
    // Clamp the score to the specified range
    const normalizedScore = Math.max(minValue, Math.min(maxValue, score));
    normalizedScores[category] = normalizedScore;
  }
  
  return normalizedScores;
}; 