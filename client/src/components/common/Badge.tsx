import React from 'react';
import { RecordStatus, ConflictStatus, WorkflowStage } from '@land-digitization/shared';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', size = 'sm' }) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const variantStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    red: 'bg-red-500/10 text-red-400 border border-red-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]}`}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: RecordStatus | ConflictStatus | WorkflowStage | string }> = ({ status }) => {
  switch (status) {
    case RecordStatus.VERIFIED:
    case ConflictStatus.RESOLVED:
    case WorkflowStage.FINAL_APPROVAL:
      return <Badge variant="emerald">{status.replace('_', ' ')}</Badge>;

    case RecordStatus.PENDING_VERIFICATION:
    case ConflictStatus.INVESTIGATING:
    case WorkflowStage.DOCUMENT_VERIFICATION:
    case WorkflowStage.FIELD_SURVEY:
      return <Badge variant="amber">{status.replace('_', ' ')}</Badge>;

    case RecordStatus.DISPUTED:
    case ConflictStatus.OPEN:
    case WorkflowStage.REJECTED:
      return <Badge variant="red">{status.replace('_', ' ')}</Badge>;

    case WorkflowStage.SUBMITTED:
    case WorkflowStage.OBJECTION_WINDOW:
      return <Badge variant="blue">{status.replace('_', ' ')}</Badge>;

    default:
      return <Badge variant="slate">{String(status).replace('_', ' ')}</Badge>;
  }
};
