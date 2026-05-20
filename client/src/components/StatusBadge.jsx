import { useTranslation } from 'react-i18next';

const statusStyles = {
  COMPLETED:   'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  PENDING:     'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  DELAYED:     'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
  CURRENT:     'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
};
const dotColors = {
  COMPLETED:   'bg-emerald-500',
  IN_PROGRESS: 'bg-blue-500',
  PENDING:     'bg-slate-400',
  DELAYED:     'bg-rose-500',
  CURRENT:     'bg-blue-500',
};

const priorityStyles = {
  LOW:    'bg-slate-100 text-slate-500',
  NORMAL: 'bg-blue-50 text-blue-600',
  HIGH:   'bg-amber-100 text-amber-700',
  URGENT: 'bg-rose-100 text-rose-700',
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const { t } = useTranslation();
  const classes = statusStyles[status] || statusStyles.PENDING;
  const dot     = dotColors[status]   || dotColors.PENDING;
  const sz = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${classes} ${sz}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {t(`status.${status}`, status)}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const { t } = useTranslation();
  const classes = priorityStyles[priority] || priorityStyles.NORMAL;
  return (
    <span className={`inline-flex items-center rounded-md text-xs font-medium px-2 py-0.5 ${classes}`}>
      {t(`priority.${priority}`, priority)}
    </span>
  );
};
