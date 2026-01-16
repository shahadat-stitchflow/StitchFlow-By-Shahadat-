
import React from 'react';
import { StepStatus } from '../../types';

interface StatusBadgeProps {
  status: StepStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    [StepStatus.PENDING]: 'bg-slate-100 text-slate-600',
    [StepStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700 animate-pulse',
    [StepStatus.COMPLETED]: 'bg-green-100 text-green-700',
    [StepStatus.APPROVED]: 'bg-emerald-100 text-emerald-700',
    [StepStatus.REJECTED]: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
