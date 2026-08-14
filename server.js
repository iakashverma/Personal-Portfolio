const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const dataHandler = require('./api/data.js');
const messagesHandler = require('./api/messages.js');
const authHandler = require('./api/auth.js');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  req.query = parsedUrl.query;

  if (pathname.startsWith('/api/')) {
    const cleanPath = pathname.replace(/\/$/, '');
    if (cleanPath === '/api/data' || cleanPath === '/api/data.js') {
      return handleApiRoute(req, res, dataHandler);
    }
    if (cleanPath === '/api/messages' || cleanPath === '/api/messages.js') {
      return handleApiRoute(req, res, messagesHandler);
    }
    if (cleanPath === '/api/auth' || cleanPath === '/api/auth.js') {
      return handleApiRoute(req, res, authHandler);
    }
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: false, error: 'API route not found' }));
  }

  let targetPath = pathname;
  if (pathname === '/admin') targetPath = '/admin.html';
  if (pathname === '/admin-dashboard') targetPath = '/admin-dashboard.html';
  if (pathname === '/login') targetPath = '/admin.html';
  if (targetPath === '/') targetPath = '/index.html';

  let filePath = path.join(__dirname, targetPath);

  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    return fs.createReadStream(filePath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  return res.end('<h1>404 Not Found</h1>');
});

async function handleApiRoute(req, res, handler) {
  const buffers = [];
  try {
    for await (const chunk of req) {
      buffers.push(chunk);
    }
  } catch (streamErr) {
    console.error('Error reading request stream:', streamErr);
  }
  const bodyBuffer = Buffer.concat(buffers);
  const rawBody = bodyBuffer.toString('utf8');

  if (rawBody.trim()) {
    try {
      req.body = JSON.parse(rawBody);
    } catch (e) {
      req.body = rawBody;
    }
  } else {
    req.body = {};
  }

  res.status = function (code) {
    res.statusCode = code;
    return res;
  };

  res.json = function (obj) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(obj));
    }
    return res;
  };

  try {
    await handler(req, res);
  } catch (err) {
    console.error('API Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
  }
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
