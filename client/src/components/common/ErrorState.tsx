import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to Load Information',
  message = 'An error occurred while communicating with the land records server. Please check your connection or retry.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`gov-card p-8 text-center flex flex-col items-center justify-center max-w-lg mx-auto border-govred-200 bg-govred-50/30 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-govred-100 flex items-center justify-center text-govred-700 mb-4 border border-govred-200">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-govred-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-600 max-w-sm mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Request
        </Button>
      )}
    </div>
  );
};
