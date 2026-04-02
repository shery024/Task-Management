// pages/_app.js
import '../styles/globals.css';
import { useState, useEffect, useCallback } from 'react';
import { AppCtx } from '../lib/context';

export default function App({ Component, pageProps }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [kvConfigured, setKvConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const r = await fetch('/api/data?type=all');
      const d = await r.json();
      setTasks(d.tasks || []);
      setUsers(d.users || []);
      setProjects(d.projects || []);
      setKvConfigured(d.kvConfigured);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    try {
      const stored = localStorage.getItem('tf_user');
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}
  }, [fetchAll]);

  useEffect(() => {
    if (!loading) {
      try {
        const stored = localStorage.getItem('tf_user');
        if (!stored) setLoginOpen(true);
      } catch {
        setLoginOpen(true);
      }
    }
  }, [loading]);

  const api = useCallback(async (method, type, body = null, id = null) => {
    const url = `/api/data?type=${type}${id ? `&id=${id}` : ''}`;
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    };
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }, []);

  const createItem = useCallback(async (type, body) => {
    const item = await api('POST', type, body);
    if (type === 'tasks') setTasks(p => [...p, item]);
    if (type === 'users') setUsers(p => [...p, item]);
    if (type === 'projects') setProjects(p => [...p, item]);
    return item;
  }, [api]);

  const updateItem = useCallback(async (type, id, body) => {
    const item = await api('PUT', type, body, id);
    if (type === 'tasks') setTasks(p => p.map(t => t.id === id ? item : t));
    if (type === 'users') setUsers(p => p.map(u => u.id === id ? item : u));
    if (type === 'projects') setProjects(p => p.map(p2 => p2.id === id ? item : p2));
    return item;
  }, [api]);

  const deleteItem = useCallback(async (type, id) => {
    await api('DELETE', type, null, id);
    if (type === 'tasks') setTasks(p => p.filter(t => t.id !== id));
    if (type === 'users') setUsers(p => p.filter(u => u.id !== id));
    if (type === 'projects') setProjects(p => p.filter(p2 => p2.id !== id));
  }, [api]);

  const login = useCallback((user) => {
    setCurrentUser(user);
    try { localStorage.setItem('tf_user', JSON.stringify(user)); } catch {}
    setLoginOpen(false);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try { localStorage.removeItem('tf_user'); } catch {}
    setLoginOpen(true);
  }, []);

  const ctx = {
    tasks, users, projects, currentUser, kvConfigured, loading,
    loginOpen, setLoginOpen,
    createItem, updateItem, deleteItem, fetchAll, login, logout,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <Component {...pageProps} />
    </AppCtx.Provider>
  );
}
