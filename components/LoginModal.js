// components/LoginModal.js
import { useState } from 'react';
import { useApp } from '../lib/context';
import { getInitials, avatarColor, ROLE_META } from '../lib/utils';

export default function LoginModal() {
  const { users, createItem, login } = useApp();
  const [step, setStep] = useState('pick'); // pick | register
  const [name, setName] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isFirstUser = users.length === 0;

  async function handleLogin(user) {
    login(user);
  }

  async function handleRegister() {
    if (!newName.trim()) return setError('Name is required');
    setLoading(true);
    setError('');
    try {
      const role = users.length === 0 ? 'admin' : 'member';
      const user = await createItem('users', {
        name: newName.trim(),
        email: newEmail.trim() || '',
        role,
      });
      login(user);
    } catch (e) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(name.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-slidein">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="white" className="w-6 h-6">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Welcome to TaskFlow</h2>
            <p className="text-slate-500 text-sm">
              {isFirstUser ? 'Set up your team workspace' : 'Who are you?'}
            </p>
          </div>
        </div>

        {step === 'pick' && !isFirstUser && (
          <>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Search your name…"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {filtered.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-sm">No match found</p>
              )}
              {filtered.map(u => (
                <button key={u.id} onClick={() => handleLogin(u)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 transition-colors text-left group">
                  <div className={`w-9 h-9 rounded-full ${avatarColor(u.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {getInitials(u.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-violet-700">{u.name}</p>
                    {u.email && <p className="text-slate-400 text-xs">{u.email}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_META[u.role]?.color}`}>
                    {ROLE_META[u.role]?.label}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('register')}
              className="w-full text-sm text-violet-600 hover:text-violet-800 font-medium py-2 border-2 border-dashed border-violet-200 rounded-xl hover:border-violet-400 transition-colors">
              + I'm new here — Create my account
            </button>
          </>
        )}

        {(step === 'register' || isFirstUser) && (
          <>
            {isFirstUser && (
              <div className="bg-violet-50 rounded-xl p-4 mb-5 text-sm text-violet-800">
                🎉 You're the first one here! You'll be set as <strong>Admin</strong>.
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Your Name *</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g. Sarah Khan"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Email (optional)</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="sarah@company.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  type="email"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex gap-3 mt-5">
              {!isFirstUser && (
                <button onClick={() => setStep('pick')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                  Back
                </button>
              )}
              <button onClick={handleRegister} disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors">
                {loading ? 'Creating…' : isFirstUser ? 'Get Started' : 'Create Account'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
