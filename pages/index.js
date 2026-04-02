// pages/index.js - Dashboard
import Link from 'next/link';
import Layout from '../components/Layout';
import { useApp } from '../lib/context';
import { formatDate, isOverdue, isDueSoon, getInitials, avatarColor, STATUS_META, PRIORITY_META, taskProgress, PROJECT_COLORS } from '../lib/utils';
import { useState } from 'react';
import TaskModal from '../components/TaskModal';

export default function Dashboard() {
  const { tasks, users, projects } = useApp();
  const [taskModal, setTaskModal] = useState(false);

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const inprog = tasks.filter(t => t.status === 'inprogress').length;
  const overdue = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length;
  const overall = total > 0 ? Math.round((done / total) * 100) : 0;

  const recent = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 6);

  const dueSoon = tasks.filter(t => isDueSoon(t.dueDate) && t.status !== 'done').slice(0, 5);

  return (
    <Layout title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tasks',  value: total,   bg: 'bg-slate-100',    icon: '📋' },
          { label: 'Completed',    value: done,    bg: 'bg-emerald-50',   icon: '✅' },
          { label: 'In Progress',  value: inprog,  bg: 'bg-blue-50',      icon: '🔄' },
          { label: 'Overdue',      value: overdue, bg: 'bg-red-50',       icon: '⚠️' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{s.value}</div>
            <div className="text-sm font-medium text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-2xl p-5 mb-6 border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Overall Progress</h2>
          <span className="text-2xl font-bold text-violet-600">{overall}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div className="bg-violet-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${overall}%` }} />
        </div>
        <p className="text-slate-500 text-sm mt-2">{done} of {total} tasks completed</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Projects Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">Projects</h2>
            <Link href="/projects" className="text-sm text-violet-600 hover:text-violet-800 font-medium">View all →</Link>
          </div>
          {projects.length === 0 ? (
            <EmptyState icon="📁" text="No projects yet" sub="Create your first project" href="/projects" />
          ) : (
            <div className="space-y-4">
              {projects.map((proj, i) => {
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                const pct = taskProgress(projTasks);
                const color = proj.color || PROJECT_COLORS[i % PROJECT_COLORS.length];
                return (
                  <div key={proj.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-sm font-semibold text-slate-700">{proj.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{projTasks.length} tasks</span>
                        <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Due Soon */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">Due Soon</h2>
            <Link href="/tasks" className="text-sm text-violet-600 hover:text-violet-800 font-medium">All tasks →</Link>
          </div>
          {dueSoon.length === 0 ? (
            <EmptyState icon="🗓️" text="Nothing due in 3 days" sub="Great job staying on track!" />
          ) : (
            <div className="space-y-2">
              {dueSoon.map(t => {
                const assignee = users.find(u => u.id === t.assigneeId);
                const pm = PRIORITY_META[t.priority];
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className={`w-1 h-10 rounded-full ${pm?.dot || 'bg-slate-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{t.title}</p>
                      <p className="text-xs text-amber-600 font-medium">{formatDate(t.dueDate)}</p>
                    </div>
                    {assignee && (
                      <div className={`w-7 h-7 rounded-full ${avatarColor(assignee.name)} flex items-center justify-center text-white text-xs font-bold`}>
                        {getInitials(assignee.name)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">Recent Activity</h2>
          <button onClick={() => setTaskModal(true)}
            className="bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors">
            + New Task
          </button>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon="🚀" text="No tasks yet" sub="Create your first task to get started" />
        ) : (
          <div className="space-y-2">
            {recent.map(t => {
              const assignee = users.find(u => u.id === t.assigneeId);
              const proj = projects.find(p => p.id === t.projectId);
              const sm = STATUS_META[t.status];
              const pm = PRIORITY_META[t.priority];
              const od = isOverdue(t.dueDate) && t.status !== 'done';
              return (
                <Link key={t.id} href="/tasks"
                  className={`flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border-l-4 ${pm?.border || 'border-l-slate-200'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {proj && <span className="text-xs text-slate-400">{proj.name}</span>}
                      {t.dueDate && (
                        <span className={`text-xs font-medium ${od ? 'text-red-500' : 'text-slate-400'}`}>
                          {od ? '⚠ ' : ''}{formatDate(t.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sm?.color}`}>
                    {sm?.label}
                  </span>
                  {assignee && (
                    <div className={`w-7 h-7 rounded-full ${avatarColor(assignee.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {getInitials(assignee.name)}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {taskModal && <TaskModal onClose={() => setTaskModal(false)} />}
    </Layout>
  );
}

function EmptyState({ icon, text, sub, href }) {
  return (
    <div className="py-8 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="font-semibold text-slate-600 text-sm">{text}</p>
      {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
      {href && <Link href={href} className="text-violet-600 text-sm font-medium mt-3 inline-block hover:underline">Get started →</Link>}
    </div>
  );
}
