// pages/api/data.js - Unified CRUD API
import { get, set, isKVConfigured } from '../../lib/storage';


export default async function handler(req, res) {
  const { type, id } = req.query;
  const VALID = ['tasks', 'users', 'projects'];

  // GET all types at once (for initial load)
  if (req.method === 'GET' && type === 'all') {
    const [tasks, users, projects] = await Promise.all([
      get('tasks'), get('users'), get('projects'),
    ]);
    const kvConfigured = await isKVConfigured();
    return res.status(200).json({ tasks, users, projects, kvConfigured });
  }

  if (!VALID.includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  if (req.method === 'GET') {
    const data = await get(type);
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!body) return res.status(400).json({ error: 'Missing body' });
    const existing = await get(type);
    const now = new Date().toISOString();
    const newItem = { ...body, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    await set(type, [...existing, newItem]);
    return res.status(201).json(newItem);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const existing = await get(type);
    const idx = existing.findIndex(item => item.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const updated = [...existing];
    updated[idx] = { ...updated[idx], ...req.body, updatedAt: new Date().toISOString() };
    await set(type, updated);
    return res.status(200).json(updated[idx]);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const existing = await get(type);
    await set(type, existing.filter(item => item.id !== id));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
