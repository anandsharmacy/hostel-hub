import { RequestStatus } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'status-pending',
    },
    'in-progress': {
      label: 'In Progress',
      className: 'status-in-progress',
    },
    completed: {
      label: 'Completed',
      className: 'status-completed',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
