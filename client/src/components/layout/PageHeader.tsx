import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center text-xs text-slate-500 mb-2" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1.5 flex-wrap">
            {breadcrumbs.map((b, idx) => (
              <li key={idx} className="flex items-center">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1 flex-shrink-0" />}
                {b.href ? (
                  <Link to={b.href} className="hover:text-govnavy-900 transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 font-medium">{b.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
