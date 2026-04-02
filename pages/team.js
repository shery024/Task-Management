// pages/team.js
import { useState } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../lib/context';
import { getInitials, avatarColor, ROLE_META } from '../lib/utils';

export default function Team() {
  const { users, tasks, currentUser, createItem, updateItem, deleteItem } = useApp();
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const isAdmin = currentUser?.role === 'admin';

  return (
    <Layout title="Team">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-500 text-sm">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        {isAdmin && (
          <button onClick={() => setModal('new')}
            className="bg-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors">
            + Add Member
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No team members yet</h3>
          <p className="text-slate-400 text-sm">Team members are added when they first log in</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map(user => {
            const userTasks = tasks.filter(t => t.assigneeId === user.id);
            const doneTasks = userTasks.filter(t => t.status === 'done').length;
            const activeTasks = userTasks.filter(t => t.status !== 'done').length;
            const isMe = user.id === currentUser?.id;

            return (
              <div key={user.id}
                className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${
                  isMe ? 'border-violet-200' : 'border-slate-100'
                }`}>
                {isMe && <div className="h-1 bg-violet-600" />}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${avatarColor(user.name)} flex items-center justify-center text-white text-lg font-bold`}>
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{user.name}</h3>
                          {isMe && <span className="text-xs text-violet-500 font-semibold">(You)</span>}
                        </div>
                        {user.email && <p className="text-slate-400 text-sm">{user.email}</p>}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_META[user.role]?.color}`}>
                      {ROLE_META[user.role]?.label}
                    </span>
                  </div>

                  {/* Task stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Total',  value: userTasks.length, color: 'text-slate-700' },
                      { label: 'Active', value: activeTasks,       color: 'text-blue-600'  },
                      { label: 'Done',   value: doneTasks,         color: 'text-emerald-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                        <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-slate-400">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {isAdmin && !isMe && (
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button onClick={() => setModal(user)}
                        className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
                        Edit Role
                      </button>
                      <button onClick={() => setDeleteId(user.id)}
                        className="px-3 py-2 rounded-lg border border-red-100 text-red-400 text-xs font-semibold hover:bg-red-50 transition-colors">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Legend */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-800 mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { role: 'admin',   perms: ['Create & delete tasks', 'Manage team members', 'Create & delete projects', 'Change roles', 'Full access'] },
            { role: 'manager', perms: ['Create & delete tasks', 'Create & delete projects', 'View team', 'Assign tasks'] },
            { role: 'member',  perms: ['View all tasks', 'Create tasks', 'Update task status', 'View projects & team'] },
          ].map(({ role, perms }) => (
            <div key={role} className="rounded-xl p-4 bg-slate-50">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_META[role]?.color} mb-3 inline-block`}>
                {ROLE_META[role]?.label}
              </span>
              <ul className="space-y-1.5 mt-2">
                {perms.map(p => (
                  <li key={p} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Role Modal */}
      {modal && modal !== 'new' && (
        <EditRoleModal
          user={modal}
          onClose={() => setModal(null)}
          onSave={async (role) => {
            await updateItem('users', modal.id, { role });
            setModal(null);
          }}
        />
      )}

      {/* Add Member Modal */}
      {modal === 'new' && (
        <AddMemberModal
          onClose={() => setModal(null)}
          onAdd={async (data) => {
            await createItem('users', data);
            setModal(null);
          }}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 modal-overlay">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-80 animate-slidein">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Member?</h3>
            <p className="text-slate-500 text-sm mb-5">Their tasks will remain but become unassigned.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={async () => { await deleteItem('users', deleteId); setDeleteId(null); }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function EditRoleModal({ user, onClose, onSave }) {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slidein">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Change Role</h2>
        <p className="text-slate-500 text-sm mb-5">{user.name}</p>
        <div className="space-y-2 mb-6">
          {Object.entries(ROLE_META).map(([k, v]) => (
            <button key={k} onClick={() => setRole(k)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                role === k ? 'border-violet-500 bg-violet-50' : 'border-slate-100 hover:border-slate-200'
              }`}>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${v.color}`}>{v.label}</span>
              {role === k && <span className="ml-auto text-violet-500 text-sm">✓</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={async () => { setLoading(true); await onSave(role); }}
            disabled={loading}
            className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd() {
    if (!name.trim()) return setError('Name is required');
    setLoading(true);
    try {
      await onAdd({ name: name.trim(), email: email.trim(), role });
    } catch {
      setError('Failed to add member.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slidein">
        <h2 className="text-lg font-bold text-slate-900 mb-5">Add Team Member</h2>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Ali Hassan"
              value={name} onChange={e => setName(e.target.value)} autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="ali@company.com" type="email"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Role</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={role} onChange={e => setRole(e.target.value)}
            >
              {Object.entries(ROLE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={loading}
            className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
            {loading ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}
