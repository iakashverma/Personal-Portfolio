const fs = require('fs');
const path = require('path');

let memoryMessages = [];

const getMessagesFilePath = () => {
  const dataDir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
  }
  return path.join(dataDir, 'messages.json');
};

const loadFromKV = async (key = 'portfolio_contact_messages') => {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl.replace(/\/$/, '')}/get/${key}`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          const json = JSON.parse(text);
          if (json && json.result !== undefined && json.result !== null) {
            return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          }
        }
      }
    } catch (err) {
      console.error('[API Messages] Error loading from KV:', err);
    }
  }
  return null;
};

const saveToKV = async (key = 'portfolio_contact_messages', msgs) => {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const payloadString = typeof msgs === 'string' ? msgs : JSON.stringify(msgs);
      const res = await fetch(`${kvUrl.replace(/\/$/, '')}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`
        },
        body: payloadString
      });
      return res.ok;
    } catch (err) {
      console.error('[API Messages] Error saving to KV:', err);
    }
  }
  return false;
};

const loadFromSupabase = async (key = 'portfolio_contact_messages') => {
  const url = process.env.SUPABASE_URL;
  const keyToken = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && keyToken) {
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/portfolio_kv?key=eq.${key}&select=value`, {
        headers: {
          'apikey': keyToken,
          'Authorization': `Bearer ${keyToken}`
        }
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          const rows = JSON.parse(text);
          if (Array.isArray(rows) && rows.length > 0) {
            const val = rows[0].value;
            return typeof val === 'string' ? JSON.parse(val) : val;
          }
        }
      }
    } catch (err) {
      console.error('[API Messages] Supabase load error:', err);
    }
  }
  return null;
};

const saveToSupabase = async (key = 'portfolio_contact_messages', msgs) => {
  const url = process.env.SUPABASE_URL;
  const keyToken = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && keyToken) {
    try {
      const payloadString = typeof msgs === 'string' ? msgs : JSON.stringify(msgs);
      const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/portfolio_kv`, {
        method: 'POST',
        headers: {
          'apikey': keyToken,
          'Authorization': `Bearer ${keyToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: key,
          value: payloadString,
          updated_at: new Date().toISOString()
        })
      });
      return res.ok;
    } catch (err) {
      console.error('[API Messages] Supabase save error:', err);
    }
  }
  return false;
};

// 3. GitHub Gist REST API Adapter
const loadFromGist = async (filename = 'messages.json') => {
  const gistId = process.env.GITHUB_GIST_ID;
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.PORTFOLIO_GITHUB_TOKEN;

  if (gistId) {
    try {
      const headers = { 'User-Agent': 'Portfolio-CMS' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          const gist = JSON.parse(text);
          const file = gist.files && (gist.files[filename] || Object.values(gist.files)[0]);
          if (file && file.content) {
            return typeof file.content === 'string' ? JSON.parse(file.content) : file.content;
          }
        }
      }
    } catch (err) {
      console.error('[API Messages] GitHub Gist load error:', err);
    }
  }
  return null;
};

const saveToGist = async (filename = 'messages.json', msgs) => {
  const gistId = process.env.GITHUB_GIST_ID;
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.PORTFOLIO_GITHUB_TOKEN;

  if (gistId && token) {
    try {
      const payloadString = typeof msgs === 'string' ? msgs : JSON.stringify(msgs, null, 2);
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Portfolio-CMS'
        },
        body: JSON.stringify({
          description: 'Akash Verma Portfolio CMS Central Data & Messages',
          files: {
            [filename]: { content: payloadString }
          }
        })
      });
      return res.ok;
    } catch (err) {
      console.error('[API Messages] GitHub Gist save error:', err);
    }
  }
  return false;
};

// 4. JSONBin.io REST API Adapter
const loadFromJSONBin = async () => {
  const binId = process.env.JSONBIN_MESSAGES_BIN_ID || process.env.JSONBIN_BIN_ID;
  const apiKey = process.env.JSONBIN_API_KEY || process.env.JSONBIN_ACCESS_KEY;

  if (binId) {
    try {
      const headers = {};
      if (apiKey) headers['X-Master-Key'] = apiKey;
      const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, { headers });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          const json = JSON.parse(text);
          if (json && Array.isArray(json.record)) return json.record;
          if (json && json.record && Array.isArray(json.record.messages)) return json.record.messages;
        }
      }
    } catch (err) {
      console.error('[API Messages] JSONBin load error:', err);
    }
  }
  return null;
};

const saveToJSONBin = async (msgs) => {
  const binId = process.env.JSONBIN_MESSAGES_BIN_ID || process.env.JSONBIN_BIN_ID;
  const apiKey = process.env.JSONBIN_API_KEY || process.env.JSONBIN_ACCESS_KEY;

  if (binId && apiKey) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey
        },
        body: JSON.stringify(msgs)
      });
      return res.ok;
    } catch (err) {
      console.error('[API Messages] JSONBin save error:', err);
    }
  }
  return false;
};

const readMessages = async () => {
  // 1. Try Upstash Redis / Vercel KV
  const kvMsgs = await loadFromKV('portfolio_contact_messages');
  if (Array.isArray(kvMsgs)) return kvMsgs;

  // 2. Try Supabase
  const supaMsgs = await loadFromSupabase('portfolio_contact_messages');
  if (Array.isArray(supaMsgs)) return supaMsgs;

  // 3. Try GitHub Gist
  const gistMsgs = await loadFromGist('messages.json');
  if (Array.isArray(gistMsgs)) return gistMsgs;

  // 4. Try JSONBin
  const binMsgs = await loadFromJSONBin();
  if (Array.isArray(binMsgs)) return binMsgs;

  if (memoryMessages && memoryMessages.length > 0) return memoryMessages;

  const filePath = getMessagesFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim()) {
        memoryMessages = JSON.parse(content);
        return memoryMessages;
      }
    } catch (e) {}
  }
  return memoryMessages || [];
};

const writeMessages = async (msgs) => {
  memoryMessages = msgs;
  await saveToKV('portfolio_contact_messages', msgs);
  await saveToSupabase('portfolio_contact_messages', msgs);
  await saveToGist('messages.json', msgs);
  await saveToJSONBin(msgs);
  try {
    const filePath = getMessagesFilePath();
    fs.writeFileSync(filePath, JSON.stringify(msgs, null, 2), 'utf8');
  } catch (e) {}
};

// Admin authentication check — validates ADMIN_API_SECRET header
const isAdminAuthenticated = (req) => {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) return true;
  const provided = (req.headers && (req.headers['x-admin-secret'] || req.headers['authorization'])) || '';
  const token = provided.startsWith('Bearer ') ? provided.slice(7) : provided;
  return token === secret;
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, x-admin-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  try {
    if (req.method === 'GET') {
      const msgs = await readMessages();
      return res.status(200).json({ success: true, messages: Array.isArray(msgs) ? msgs : [] });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return res.status(400).json({ success: false, error: 'Malformed JSON payload in request body' });
        }
      }

      if (!body || typeof body !== 'object') {
        return res.status(400).json({ success: false, error: 'Request body must be a valid JSON object' });
      }

      if (body.action === 'save_all' && Array.isArray(body.messages)) {
        // Admin-only operation: requires authentication
        if (!isAdminAuthenticated(req)) {
          return res.status(401).json({ success: false, error: 'Unauthorized — invalid or missing admin secret' });
        }
        await writeMessages(body.messages);
        return res.status(200).json({ success: true, messages: body.messages });
      }

      if (body.name && body.email) {
        const current = await readMessages();
        const newMessage = {
          id: '_' + Math.random().toString(36).slice(2, 11),
          name: String(body.name).trim(),
          email: String(body.email).trim(),
          subject: String(body.subject || 'Portfolio Inquiry').trim(),
          message: String(body.message || '').trim(),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          read: false
        };
        current.unshift(newMessage);
        await writeMessages(current);
        return res.status(200).json({ success: true, message: newMessage });
      }

      return res.status(400).json({ success: false, error: 'Invalid message data' });
    }

    if (req.method === 'DELETE') {
      // Admin-only operation: requires authentication
      if (!isAdminAuthenticated(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized — invalid or missing admin secret' });
      }

      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {}
      }

      const query = req.query || {};
      const targetId = (body && body.id) || query.id;

      let current = await readMessages();
      if (targetId) {
        current = current.filter(m => m.id !== targetId);
      } else {
        current = [];
      }
      await writeMessages(current);
      return res.status(200).json({ success: true, messages: current });
    }

    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error('[API Messages] Endpoint error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
};
