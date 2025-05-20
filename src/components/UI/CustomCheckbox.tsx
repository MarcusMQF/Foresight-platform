import React from 'react';
import { Check, Square } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  className = ''
}) => {
  return (
    <button
      onClick={onChange}
      className={`w-5 h-5 flex items-center justify-center transition-colors duration-200 ${className}`}
      aria-checked={checked}
      role="checkbox"
    >
      {checked ? (
        <div className="w-[15px] h-[15px] bg-orange-500 flex items-center justify-center rounded-sm">
          <Check size={11} className="text-white" strokeWidth={3} />
        </div>
      ) : (
        <Square size={15} className="text-gray-400" fill="none" />
      )}
    </button>
  );
};

export default CustomCheckbox; 