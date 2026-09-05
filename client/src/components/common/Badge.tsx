import React from 'react';
import { RecordStatus, ConflictStatus, WorkflowStage } from '@land-digitization/shared';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'navy';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  withDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  withDot = false,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[11px] font-bold',
    md: 'px-3 py-1 text-xs font-bold',
  };

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-2xs',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80 shadow-2xs',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80 shadow-2xs',
    info: 'bg-blue-50 text-blue-800 border-blue-200/80 shadow-2xs',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/90 shadow-2xs',
    navy: 'bg-govnavy-50 text-govnavy-900 border-govnavy-200 shadow-2xs',
  };

  const dotColorStyles = {
    success: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
    warning: 'bg-amber-500 shadow-xs shadow-amber-500/50',
    danger: 'bg-rose-500 shadow-xs shadow-rose-500/50',
    info: 'bg-blue-500 shadow-xs shadow-blue-500/50',
    neutral: 'bg-slate-400',
    navy: 'bg-govnavy-900',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase font-sans ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorStyles[variant]}`} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{
  status: RecordStatus | ConflictStatus | WorkflowStage | string;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const formatted = String(status).replace(/_/g, ' ');

  switch (status) {
    case RecordStatus.VERIFIED:
    case ConflictStatus.RESOLVED:
    case WorkflowStage.VERIFIED:
    case 'FINAL_APPROVAL':
      return (
        <Badge variant="success" size={size} withDot>
          {formatted}
        </Badge>
      );

    case RecordStatus.PENDING_VERIFICATION:
    case ConflictStatus.INVESTIGATING:
    case WorkflowStage.UNDER_REVIEW:
    case WorkflowStage.PROCESSING:
    case 'DOCUMENT_VERIFICATION':
    case 'FIELD_SURVEY':
      return (
        <Badge variant="warning" size={size} withDot>
          {formatted}
        </Badge>
      );

    case RecordStatus.DISPUTED:
    case ConflictStatus.OPEN:
    case WorkflowStage.REJECTED:
    case WorkflowStage.NEEDS_CORRECTION:
      return (
        <Badge variant="danger" size={size} withDot>
          {formatted}
        </Badge>
      );

    case WorkflowStage.SUBMITTED:
    case 'OBJECTION_WINDOW':
      return (
        <Badge variant="info" size={size} withDot>
          {formatted}
        </Badge>
      );

    case RecordStatus.DRAFT:
    case RecordStatus.ARCHIVED:
    case ConflictStatus.DISMISSED:
    default:
      return (
        <Badge variant="neutral" size={size} withDot>
          {formatted}
        </Badge>
      );
  }
};
