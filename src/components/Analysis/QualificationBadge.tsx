import React from 'react';
import { CheckCircle, ThumbsDown, AlertTriangle } from 'lucide-react';

interface QualificationBadgeProps {
  status: 'qualified' | 'partially_qualified' | 'not_qualified' | string;
}

const statusConfig = {
  qualified: {
    label: 'Qualified',
    icon: <CheckCircle size={12} className="text-green-600" />,
    bg: 'bg-green-50',
    border: 'border-green-300',
    glow: 'shadow-[0_0_12px_2px_rgba(34,197,94,0.15)]',
    text: 'text-green-700',
  },
  partially_qualified: {
    label: 'Partially Qualified',
    icon: <AlertTriangle size={12} className="text-yellow-600" />,
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    glow: 'shadow-[0_0_12px_2px_rgba(253,224,71,0.15)]',
    text: 'text-yellow-700',
  },
  not_qualified: {
    label: 'Not Qualified',
    icon: <ThumbsDown size={12} className="text-red-600" />,
    bg: 'bg-red-50',
    border: 'border-red-300',
    glow: 'shadow-[0_0_12px_2px_rgba(239,68,68,0.15)]',
    text: 'text-red-700',
  },
};

const QualificationBadge: React.FC<QualificationBadgeProps> = ({ status }) => {
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_qualified;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium text-xs ${cfg.bg} ${cfg.border} ${cfg.text} ${cfg.glow}`}
      style={{ minWidth: 0 }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

export default QualificationBadge; 