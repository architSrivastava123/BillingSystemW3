const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const usage = require('./usage');

const PORT = 3000;

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON format'));
      }
    });

    req.on('error', err => reject(err));
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode);
  res.end(JSON.stringify(data));
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File Not Found');
    } else {
      res.writeHead(200);
      res.end(content);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (pathname === '/api/resources' && method === 'GET') {
    const resources = usage.getResourcesWithAvailability();
    return sendJson(res, 200, { success: true, resources });
  }

  if (pathname === '/api/usage/active' && method === 'GET') {
    const activeSessions = usage.getActiveSessions();
    return sendJson(res, 200, { success: true, activeSessions });
  }

  if (pathname === '/api/usage/history' && method === 'GET') {
    const history = usage.getCompletedSessions();
    return sendJson(res, 200, { success: true, history });
  }

  if (pathname === '/api/usage/start' && method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { userId, resourceId, serviceId } = body;
      const result = usage.startUsage(userId, resourceId, serviceId);

      return sendJson(res, result.statusCode, result);
    } catch (err) {
      return sendJson(res, 400, {
        success: false,
        message: err.message
      });
    }
  }

  if (pathname === '/api/usage/stop' && method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { sessionId } = body;
      const result = usage.stopUsage(sessionId);

      return sendJson(res, result.statusCode, result);
    } catch (err) {
      return sendJson(res, 400, {
        success: false,
        message: err.message
      });
    }
  }

  const publicDir = __dirname;

  if (pathname === '/' || pathname === '/index.html') {
    return serveStaticFile(res, path.join(publicDir, 'index.html'));
  }

  if (pathname === '/style.css') {
    return serveStaticFile(res, path.join(publicDir, 'style.css'));
  }

  if (pathname === '/app.js') {
    return serveStaticFile(res, path.join(publicDir, 'app.js'));
  }

  return sendJson(res, 404, {
    success: false,
    message: 'Endpoint not found'
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});