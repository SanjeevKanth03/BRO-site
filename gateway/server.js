import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';

const app = express();
app.use(express.json());
app.use(cors({ origin: '*'}));

const PORT = process.env.PORT || 4000;
const PY_BACKEND_URL = process.env.PY_BACKEND_URL || 'http://backend:8000';

// simple JSON storage
const dbFile = new JSONFile('./data/db.json');
const db = new Low(dbFile, { requests: [] });
await db.read();
db.data ||= { requests: [] };

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/optimize', async (req, res) => {
  try {
    const id = nanoid();
    const payload = req.body;
    const r = await fetch(`${PY_BACKEND_URL}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();

    db.data.requests.push({ id, createdAt: new Date().toISOString(), payload, response: data });
    await db.write();

    res.status(r.ok ? 200 : 400).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Gateway error', detail: String(e) });
  }
});

app.get('/history', async (req, res) => {
  const recent = [...db.data.requests].slice(-20).reverse();
  res.json(recent);
});

app.listen(PORT, () => {
  console.log(`Gateway listening on ${PORT}, proxying to ${PY_BACKEND_URL}`);
});


