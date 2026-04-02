// lib/utils.js

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
}

export function isDueSoon(dateStr) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  const diff = (due - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 3;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function avatarColor(name) {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export const STATUS_META = {
  todo:        { label: 'To Do',       color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
  inprogress:  { label: 'In Progress', color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500'  },
  inreview:    { label: 'In Review',   color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500' },
  done:        { label: 'Done',        color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

export const PRIORITY_META = {
  low:    { label: 'Low',    color: 'text-slate-500',  border: 'border-l-slate-300',  badge: 'bg-slate-100 text-slate-600'  },
  medium: { label: 'Medium', color: 'text-blue-600',   border: 'border-l-blue-400',   badge: 'bg-blue-100 text-blue-700'    },
  high:   { label: 'High',   color: 'text-amber-600',  border: 'border-l-amber-400',  badge: 'bg-amber-100 text-amber-700'  },
  urgent: { label: 'Urgent', color: 'text-red-600',    border: 'border-l-red-500',    badge: 'bg-red-100 text-red-700'      },
};

export const ROLE_META = {
  admin:   { label: 'Admin',   color: 'bg-violet-100 text-violet-700'  },
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700'      },
  member:  { label: 'Member',  color: 'bg-slate-100 text-slate-600'    },
};

export const PROJECT_COLORS = [
  '#6d28d9','#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#c2410c',
];

export function taskProgress(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter(t => t.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
}
