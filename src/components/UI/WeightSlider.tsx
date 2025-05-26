import React, { useState } from 'react';

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
  
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState(value);
  
  // Calculate percentage for visual indicators
  const percentage = ((localValue - min) / (max - min)) * 100;
  const valueLevel = percentage > 75 ? 'high' : percentage > 40 ? 'medium' : 'low';
  
  // Handle range input changes
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };
  
  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      const clampedValue = Math.min(max, Math.max(min, val));
      setLocalValue(clampedValue);
      onChange(clampedValue);
    }
  };
  
  // Update local value when prop changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-medium text-gray-700">{formattedLabel}:</label>
        <input
          type="number"
          className="w-14 text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          value={localValue.toFixed(1)}
          step={step}
          min={min}
          max={max}
          onChange={handleNumberChange}
        />
      </div>
      <div className="relative">
        <div className="w-full h-1.5 bg-gray-200 rounded-lg overflow-hidden">
          <div 
            className={`h-1.5 rounded-lg ${
              valueLevel === 'high' ? 'bg-primary-500' : 
              valueLevel === 'medium' ? 'bg-primary-400' : 
              'bg-primary-300'
            }`} 
            style={{ 
              width: `${percentage}%`,
              transition: 'none' 
            }}
          />
        </div>
        
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleRangeChange}
          className="absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer"
        />
        
        <div 
          className="absolute top-[-4px] pointer-events-none"
          style={{ 
            left: `calc(${percentage}% - 8px)`,
            transition: 'none'
          }}
        >
          <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
            valueLevel === 'high' ? 'bg-primary-500' : 
            valueLevel === 'medium' ? 'bg-primary-400' : 
            'bg-primary-300'
          }`} />
        </div>
      </div>
      
      {/* Value indicators */}
      <div className="flex justify-between text-[9px] text-gray-500 mt-1">
        <span>Min</span>
        <span>Max</span>
      </div>
    </div>
  );
};

export default WeightSlider; 