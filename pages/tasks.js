// pages/tasks.js
import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../lib/context';
import TaskModal from '../components/TaskModal';
import { formatDate, isOverdue, getInitials, avatarColor, STATUS_META, PRIORITY_META } from '../lib/utils';

const COLUMNS = [
  { key: 'todo',       ...STATUS_META.todo       },
  { key: 'inprogress', ...STATUS_META.inprogress  },
  { key: 'inreview',   ...STATUS_META.inreview    },
  { key: 'done',       ...STATUS_META.done        },
];

export default function Tasks() {
  const { tasks, users, projects, currentUser, updateItem, deleteItem } = useApp();
  const [view, setView] = useState('board'); // board | list
  const [modal, setModal] = useState(null); // null | 'new' | task object
  const [filters, setFilters] = useState({ project: '', assignee: '', priority: '', search: '' });
  const [deleteId, setDeleteId] = useState(null);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filters.project && t.projectId !== filters.project) return false;
      if (filters.assignee && t.assigneeId !== filters.assignee) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filters]);

  async function changeStatus(taskId, status) {
    await updateItem('tasks', taskId, { status });
  }

  async function confirmDelete() {
    if (deleteId) {
      await deleteItem('tasks', deleteId);
      setDeleteId(null);
    }
  }

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return (
    <Layout title="Tasks">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Search tasks…"
            value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          />
        </div>

        {/* Filters */}
        <select
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={filters.project}
          onChange={e => setFilters(p => ({ ...p, project: e.target.value }))}
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={filters.assignee}
          onChange={e => setFilters(p => ({ ...p, assignee: e.target.value }))}
        >
          <option value="">All Members</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <select
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={filters.priority}
          onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}
        >
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {/* View toggle */}
        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
          {['board', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${
                view === v ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {v === 'board' ? '⊞' : '≡'} {v}
            </button>
          ))}
        </div>

        <button onClick={() => setModal('new')}
          className="bg-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors">
          + New Task
        </button>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>

      {/* Board View */}
      {view === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-bold text-slate-700">{col.label}</span>
                  <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>
                <div className="p-3 space-y-2 min-h-16">
                  {colTasks.length === 0 && (
                    <p className="text-center text-slate-300 text-xs py-4">No tasks</p>
                  )}
                  {colTasks.map(t => (
                    <TaskCard key={t.id} task={t} users={users} projects={projects}
                      onEdit={() => setModal(t)}
                      onDelete={() => setDeleteId(t.id)}
                      onStatusChange={changeStatus}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Task', 'Project', 'Assignee', 'Priority', 'Due Date', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No tasks found</td></tr>
              )}
              {filtered.map(t => {
                const assignee = users.find(u => u.id === t.assigneeId);
                const proj = projects.find(p => p.id === t.projectId);
                const sm = STATUS_META[t.status];
                const pm = PRIORITY_META[t.priority];
                const od = isOverdue(t.dueDate) && t.status !== 'done';
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className={`px-4 py-3 border-l-4 ${pm?.border}`}>
                      <p className="font-semibold text-slate-800 truncate max-w-xs">{t.title}</p>
                      {t.description && <p className="text-xs text-slate-400 truncate max-w-xs">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{proj?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {assignee ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${avatarColor(assignee.name)} flex items-center justify-center text-white text-xs font-bold`}>
                            {getInitials(assignee.name)}
                          </div>
                          <span className="text-slate-600">{assignee.name}</span>
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${pm?.badge}`}>
                        {pm?.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs font-medium ${od ? 'text-red-500' : 'text-slate-500'}`}>
                      {t.dueDate ? `${od ? '⚠ ' : ''}${formatDate(t.dueDate)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t.status}
                        onChange={e => changeStatus(t.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${sm?.color}`}
                      >
                        {Object.entries(STATUS_META).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal(t)}
                          className="text-slate-400 hover:text-violet-600 text-xs font-medium transition-colors">
                          Edit
                        </button>
                        {isAdmin && (
                          <button onClick={() => setDeleteId(t.id)}
                            className="text-slate-300 hover:text-red-500 text-xs transition-colors">
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Modal */}
      {modal && (
        <TaskModal
          task={modal !== 'new' ? modal : null}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 modal-overlay">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-80 animate-slidein">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Task?</h3>
            <p className="text-slate-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function TaskCard({ task, users, projects, onEdit, onDelete, onStatusChange, isAdmin }) {
  const assignee = users.find(u => u.id === task.assigneeId);
  const proj = projects.find(p => p.id === task.projectId);
  const sm = STATUS_META[task.status];
  const pm = PRIORITY_META[task.priority];
  const od = isOverdue(task.dueDate) && task.status !== 'done';

  return (
    <div className={`bg-white border border-slate-100 rounded-xl p-3.5 hover:shadow-sm transition-shadow border-l-4 ${pm?.border} cursor-pointer`}
      onClick={onEdit}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-slate-800 leading-snug flex-1">{task.title}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAdmin && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              className="text-slate-300 hover:text-red-400 transition-colors text-xs">✕</button>
          )}
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-slate-400 mb-2 line-clamp-2">{task.description}</p>
      )}
      {proj && (
        <div className="text-xs text-slate-400 mb-2">📁 {proj.name}</div>
      )}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          {task.dueDate && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              od ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {od ? '⚠ ' : '📅 '}{formatDate(task.dueDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={task.status}
            onChange={e => { e.stopPropagation(); onStatusChange(task.id, e.target.value); }}
            onClick={e => e.stopPropagation()}
            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${sm?.color}`}
          >
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {assignee && (
            <div className={`w-6 h-6 rounded-full ${avatarColor(assignee.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
              title={assignee.name}>
              {getInitials(assignee.name)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
