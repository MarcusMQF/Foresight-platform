import React from 'react';

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const WeightSlider: React.FC<WeightSliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 5,
  step = 0.1
}) => {
  // Format the label to capitalize first letter
  const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-gray-700">{formattedLabel}:</label>
        <input
          type="number"
          className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
          value={value.toFixed(1)}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
              onChange(val);
            }
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
      />
    </div>
  );
};

export default WeightSlider; 