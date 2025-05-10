import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'tertiary';
  trend?: {
    value: number;
    isUp: boolean;
  };
  subtitle?: string;
};

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  subtitle
}) => {
  const colorVariants = {
    primary: {
      bg: 'bg-white',
      iconBg: 'bg-primary-500',
      iconText: 'text-white',
      accentBg: 'bg-primary-50',
      border: 'border-primary-200',
      shadow: 'shadow-sm shadow-primary-100/50',
    },
    secondary: {
      bg: 'bg-white',
      iconBg: 'bg-secondary-500',
      iconText: 'text-white',
      accentBg: 'bg-secondary-50',
      border: 'border-secondary-200',
      shadow: 'shadow-sm shadow-secondary-100/50',
    },
    tertiary: {
      bg: 'bg-white',
      iconBg: 'bg-tertiary-500',
      iconText: 'text-white',
      accentBg: 'bg-tertiary-50',
      border: 'border-tertiary-200',
      shadow: 'shadow-sm shadow-tertiary-100/50',
    },
  };

  const colorClasses = colorVariants[color];

  return (
    <div className={`
      rounded-md p-5 
      ${colorClasses.bg} border-2 ${colorClasses.border}
      ${colorClasses.shadow}
      transition-all duration-200 hover:shadow-md group
      relative overflow-hidden
    `}>
      <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 
        ${colorClasses.accentBg}"></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-gray-500 text-xs font-medium mb-1">{title}</h3>
          <p className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          
          {trend && (
            <div className={`
              flex items-center mt-2 text-xs font-medium gap-1
              ${trend.isUp ? 'text-green-600' : 'text-red-500'}
            `}>
              {trend.isUp ? 
                <TrendingUp size={14} className="stroke-current" /> : 
                <TrendingDown size={14} className="stroke-current" />
              }
              <span>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        
        <div className={`
          w-10 h-10 rounded-md flex items-center justify-center shadow-sm
          transition-transform duration-200 group-hover:scale-110
          ${colorClasses.iconBg} ${colorClasses.iconText}
        `}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;