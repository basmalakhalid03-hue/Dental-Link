export const format = {
  date: (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
  time: (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—',
  datetime: (d) => d ? `${format.date(d)} at ${format.time(d)}` : '—',
  relative: (d) => {
    if (!d) return '—';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  },
  // Returns number of days until due date (negative = overdue)
  daysLeft: (d) => {
    if (!d) return null;
    const diff = new Date(d).setHours(23, 59, 59, 0) - Date.now();
    return Math.ceil(diff / 86400000);
  },
  // Human-readable due date label
  daysLeftLabel: (d) => {
    const days = format.daysLeft(d);
    if (days === null) return null;
    if (days < 0)  return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  },
  // Severity for styling
  daysLeftSeverity: (d) => {
    const days = format.daysLeft(d);
    if (days === null) return 'none';
    if (days < 0)   return 'overdue';
    if (days === 0) return 'today';
    if (days <= 3)  return 'soon';
    return 'ok';
  },
  fileSize: (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  },
};
