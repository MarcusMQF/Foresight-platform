import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Register the required chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export interface ScoreCategory {
  name: string;
  value: number;
}

export interface RadarChartProps {
  data: ScoreCategory[];
  maxValue?: number;
  title?: string;
  colorScheme?: {
    borderColor: string;
    backgroundColor: string;
  };
  compact?: boolean;
}

const defaultColors = [
  { borderColor: 'rgb(53, 162, 235)', backgroundColor: 'rgba(53, 162, 235, 0.2)' },
  { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)' },
  { borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.2)' },
  { borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)' },
  { borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)' },
  { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)' }
];

const RadarChart: React.FC<RadarChartProps> = ({ 
  data, 
  maxValue = 100, 
  title,
  colorScheme,
  compact = false
}) => {
  // Default color is the first in our default colors array
  const chartColor = colorScheme || defaultColors[0];
  
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: title || 'Score Breakdown',
        data: data.map(item => item.value),
        backgroundColor: chartColor.backgroundColor,
        borderColor: chartColor.borderColor,
        borderWidth: compact ? 1.5 : 2,
        fill: true,
        pointBorderColor: chartColor.borderColor,
        pointBackgroundColor: '#fff',
        pointBorderWidth: compact ? 0.5 : 1,
        pointHoverRadius: compact ? 3 : 5,
        pointHoverBackgroundColor: chartColor.borderColor,
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: compact ? 1 : 2,
        pointRadius: compact ? 2 : 3,
      }
    ]
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: compact ? 0.5 : 1,
        },
        suggestedMin: 0,
        suggestedMax: maxValue,
        ticks: {
          stepSize: maxValue / (compact ? 2 : 5),
          backdropColor: 'transparent',
          color: '#666',
          font: {
            size: compact ? 8 : 12,
          },
          display: !compact,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          circular: true,
          lineWidth: compact ? 0.5 : 1,
        },
        pointLabels: {
          color: '#333',
          font: {
            size: compact ? 9 : 12,
            weight: compact ? 'bold' as const : 'normal' as const,
          },
          padding: compact ? 8 : 12,
        },
      },
    },
    plugins: {
      legend: {
        display: !!title && !compact,
        position: 'top' as const,
        labels: {
          font: {
            size: compact ? 10 : 14,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: compact ? 12 : 14,
        },
        bodyFont: {
          size: compact ? 11 : 13,
        },
        padding: compact ? 6 : 10,
        displayColors: false,
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    devicePixelRatio: 2,
  };

  return (
    <div className={`radar-chart-container ${compact ? 'p-0' : ''}`} 
      style={{ 
        width: '100%', 
        maxWidth: compact ? '320px' : '500px',
        margin: '0 auto',
        height: compact ? '190px' : '300px',
      }}>
      <Radar data={chartData} options={options} />
    </div>
  );
};

export default RadarChart; 