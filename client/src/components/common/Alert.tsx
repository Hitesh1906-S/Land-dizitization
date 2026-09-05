import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-govgreen-50 border-govgreen-200 text-govgreen-900',
    warning: 'bg-govamber-50 border-govamber-200 text-govamber-900',
    danger: 'bg-govred-50 border-govred-200 text-govred-900',
    info: 'bg-govblue-50 border-govblue-200 text-govblue-900',
  };

  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-govgreen-700 flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-govamber-700 flex-shrink-0" />,
    danger: <AlertCircle className="h-5 w-5 text-govred-700 flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-govblue-700 flex-shrink-0" />,
  };

  return (
    <div className={`p-4 rounded-lg border text-sm flex items-start gap-3 shadow-gov-sm ${variantStyles[variant]} ${className}`}>
      {iconMap[variant]}
      <div className="flex-1">
        {title && <h5 className="font-semibold text-sm mb-0.5 leading-snug">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
