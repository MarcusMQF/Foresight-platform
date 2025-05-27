import React from 'react';
import RadarChart, { ScoreCategory } from './RadarChart';

export interface RadarChartData {
  title?: string;
  categories: ScoreCategory[];
  colorScheme?: {
    borderColor: string;
    backgroundColor: string;
  };
}

interface MultiRadarChartsProps {
  charts: RadarChartData[];
  maxValue?: number;
  className?: string;
}

const defaultColors = [
  { borderColor: 'rgb(53, 162, 235)', backgroundColor: 'rgba(53, 162, 235, 0.2)' },
  { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)' },
  { borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.2)' },
  { borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)' }, 
  { borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)' },
  { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)' }
];

const MultiRadarCharts: React.FC<MultiRadarChartsProps> = ({ 
  charts, 
  maxValue = 100,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {charts.map((chart, index) => (
        <div key={`radar-chart-${index}`} className="radar-chart-wrapper">
          <RadarChart 
            data={chart.categories} 
            maxValue={maxValue} 
            title={chart.title}
            colorScheme={chart.colorScheme || defaultColors[index % defaultColors.length]}
          />
        </div>
      ))}
    </div>
  );
};

export default MultiRadarCharts; 