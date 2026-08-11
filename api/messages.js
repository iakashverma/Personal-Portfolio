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

const loadFromKV = async () => {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/portfolio_contact_messages`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.result) {
          return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
        }
      }
    } catch (err) {
      console.error('[API Messages] Error loading from KV:', err);
    }
  }
  return null;
};

const saveToKV = async (msgs) => {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      await fetch(`${kvUrl}/set/portfolio_contact_messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify(msgs))
      });
      return true;
    } catch (err) {
      console.error('[API Messages] Error saving to KV:', err);
    }
  }
  return false;
};

const readMessages = async () => {
  const kvMsgs = await loadFromKV();
  if (Array.isArray(kvMsgs)) return kvMsgs;

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
  await saveToKV(msgs);
  try {
    const filePath = getMessagesFilePath();
    fs.writeFileSync(filePath, JSON.stringify(msgs, null, 2), 'utf8');
  } catch (e) {}
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const msgs = await readMessages();
      return res.status(200).json({ success: true, messages: msgs });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }

      if (body && body.action === 'save_all' && Array.isArray(body.messages)) {
        await writeMessages(body.messages);
        return res.status(200).json({ success: true, messages: body.messages });
      }

      if (body && body.name && body.email) {
        const current = await readMessages();
        const newMessage = {
          id: '_' + Math.random().toString(36).slice(2, 11),
          name: body.name,
          email: body.email,
          subject: body.subject || 'Portfolio Inquiry',
          message: body.message || '',
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
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
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

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[API Messages] Endpoint error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
};
