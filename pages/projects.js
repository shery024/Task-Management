// pages/projects.js
import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useApp } from '../lib/context';
import { taskProgress, PROJECT_COLORS, STATUS_META } from '../lib/utils';

export default function Projects() {
  const { projects, tasks, currentUser, createItem, updateItem, deleteItem } = useApp();
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return (
    <Layout title="Projects">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-500 text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        {isAdmin && (
          <button onClick={() => setModal('new')}
            className="bg-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors">
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <div className="text-5xl mb-4">📁</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No projects yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create a project to start organizing your tasks</p>
          {isAdmin && (
            <button onClick={() => setModal('new')}
              className="bg-violet-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-violet-700">
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((proj, i) => {
            const projTasks = tasks.filter(t => t.projectId === proj.id);
            const pct = taskProgress(projTasks);
            const color = proj.color || PROJECT_COLORS[i % PROJECT_COLORS.length];
            const byStatus = {
              todo:       projTasks.filter(t => t.status === 'todo').length,
              inprogress: projTasks.filter(t => t.status === 'inprogress').length,
              inreview:   projTasks.filter(t => t.status === 'inreview').length,
              done:       projTasks.filter(t => t.status === 'done').length,
            };
            return (
              <div key={proj.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-2" style={{ background: color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{proj.name}</h3>
                      {proj.description && (
                        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{proj.description}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 ml-2 flex-shrink-0">
                        <button onClick={() => setModal(proj)}
                          className="text-slate-300 hover:text-violet-500 transition-colors text-sm px-1">✎</button>
                        <button onClick={() => setDeleteId(proj.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors text-sm px-1">✕</button>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-500">Progress</span>
                      <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {Object.entries(byStatus).map(([k, v]) => (
                      <div key={k} className="text-center">
                        <div className="text-xl font-bold text-slate-800">{v}</div>
                        <div className="text-xs text-slate-400 leading-tight">{STATUS_META[k]?.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                    <span>{projTasks.length} total tasks</span>
                    <Link href="/tasks" className="text-violet-600 font-semibold hover:text-violet-800">
                      View Tasks →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <ProjectModal
          project={modal !== 'new' ? modal : null}
          onClose={() => setModal(null)}
          onCreate={(data) => createItem('projects', data)}
          onUpdate={(id, data) => updateItem('projects', id, data)}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 modal-overlay">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-80 animate-slidein">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Project?</h3>
            <p className="text-slate-500 text-sm mb-5">Tasks will remain but become unassigned from this project.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={async () => { await deleteItem('projects', deleteId); setDeleteId(null); }}
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

function ProjectModal({ project, onClose, onCreate, onUpdate }) {
  const isEdit = !!project;
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || PROJECT_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name.trim()) return setError('Project name is required');
    setLoading(true);
    try {
      if (isEdit) {
        await onUpdate(project.id, { name: name.trim(), description: description.trim(), color });
      } else {
        await onCreate({ name: name.trim(), description: description.trim(), color });
      }
      onClose();
    } catch {
      setError('Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slidein">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Project Name *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Website Redesign"
              value={name} onChange={e => setName(e.target.value)} autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="What is this project about?" rows={3}
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Project Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-110'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
