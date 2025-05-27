import React from 'react';
import { ScoreCategory } from './RadarChart';

interface RadarChartLegendProps {
  data: ScoreCategory[];
  maxValue?: number;
  colorScheme?: {
    borderColor: string;
    backgroundColor: string;
  };
}

const RadarChartLegend: React.FC<RadarChartLegendProps> = ({
  data,
  maxValue = 10,
  colorScheme
}) => {
  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs mt-1 px-1">
      {data.map((item, index) => {
        // Calculate percentage value (rounded to whole number, correct scale)
        const percentValue = Math.round((item.value / maxValue) * 100);
        return (
          <div key={index} className="flex items-center px-1.5 py-0.5 border border-gray-100 rounded-md bg-gray-50 bg-opacity-60">
            {/* Removed icon for each breakdown */}
            <span className="text-[10px] text-gray-700 font-medium truncate mr-1">{item.name}</span>
            <span className="text-[10px] text-gray-500 font-medium ml-auto">
              {percentValue}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RadarChartLegend; 