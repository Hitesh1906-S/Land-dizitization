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
    navy: 'bg-slate-100 text-govnavy-900 border-slate-200 group-hover:bg-govnavy-900 group-hover:text-white',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80 group-hover:bg-blue-600 group-hover:text-white',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 group-hover:bg-emerald-600 group-hover:text-white',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80 group-hover:bg-amber-600 group-hover:text-white',
    red: 'bg-rose-50 text-rose-700 border-rose-200/80 group-hover:bg-rose-600 group-hover:text-white',
  };

  return (
    <Card className="p-4 sm:p-5 gov-card-interactive group bg-white hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-display tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl border transition-all duration-300 shadow-2xs shrink-0 ${iconColorStyles[color]}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {(change || description || badgeText) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          {change && (
            <div className="flex items-center gap-1">
              {changeType === 'positive' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />}
              {changeType === 'negative' && <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />}
              <span
                className={`font-bold ${
                  changeType === 'positive'
                    ? 'text-emerald-700'
                    : changeType === 'negative'
                    ? 'text-rose-700'
                    : 'text-slate-600'
                }`}
              >
                {change}
              </span>
              {description && <span className="text-slate-500 ml-1 truncate">{description}</span>}
            </div>
          )}
          {!change && description && <span className="text-slate-500 text-[11px] font-medium truncate">{description}</span>}
          {badgeText && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
