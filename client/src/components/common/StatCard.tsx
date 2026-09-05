import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  badgeText?: string;
  color?: 'navy' | 'blue' | 'green' | 'amber' | 'red';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  description,
  badgeText,
  color = 'navy',
}) => {
  const iconColorStyles = {
    navy: 'bg-govnavy-50 text-govnavy-800 border-govnavy-200',
    blue: 'bg-govblue-50 text-govblue-700 border-govblue-200',
    green: 'bg-govgreen-50 text-govgreen-700 border-govgreen-200',
    amber: 'bg-govamber-50 text-govamber-700 border-govamber-200',
    red: 'bg-govred-50 text-govred-700 border-govred-200',
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg border ${iconColorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(change || description || badgeText) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {change && (
            <div className="flex items-center gap-1">
              {changeType === 'positive' && <ArrowUpRight className="w-3.5 h-3.5 text-govgreen-600" />}
              {changeType === 'negative' && <ArrowDownRight className="w-3.5 h-3.5 text-govred-600" />}
              <span
                className={`font-semibold ${
                  changeType === 'positive'
                    ? 'text-govgreen-700'
                    : changeType === 'negative'
                    ? 'text-govred-700'
                    : 'text-slate-600'
                }`}
              >
                {change}
              </span>
              {description && <span className="text-slate-500 ml-1">{description}</span>}
            </div>
          )}
          {!change && description && <span className="text-slate-500">{description}</span>}
          {badgeText && (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
