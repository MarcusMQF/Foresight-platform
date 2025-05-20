import React from 'react';

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const WeightSlider: React.FC<WeightSliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100
}) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <span className="text-xs text-orange-600 font-medium">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
      />
    </div>
  );
};

export default WeightSlider; 