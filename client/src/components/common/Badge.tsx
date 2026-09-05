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
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const variantStyles = {
    success: 'bg-govgreen-50 text-govgreen-800 border-govgreen-200',
    warning: 'bg-govamber-50 text-govamber-800 border-govamber-200',
    danger: 'bg-govred-50 text-govred-800 border-govred-200',
    info: 'bg-govblue-50 text-govblue-800 border-govblue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    navy: 'bg-govnavy-50 text-govnavy-800 border-govnavy-200',
  };

  const dotColorStyles = {
    success: 'bg-govgreen-600',
    warning: 'bg-govamber-600',
    danger: 'bg-govred-600',
    info: 'bg-govblue-600',
    neutral: 'bg-slate-500',
    navy: 'bg-govnavy-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorStyles[variant]}`} />}
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
