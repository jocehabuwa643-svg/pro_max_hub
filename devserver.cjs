/* Минимальный статический сервер для локального просмотра.
   node devserver.cjs  →  http://localhost:4173 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  // POST /_save?name=frame.jpg — принять data-URL и положить в tools/
  // Нужно, чтобы вытаскивать кадры из видео на проверку: декодера
  // видео вне браузера на этой машине нет.
  if (req.method === 'POST' && req.url.startsWith('/_save')) {
    const name = (new URL(req.url, 'http://x').searchParams.get('name') || 'dump.bin')
      .replace(/[^\w.-]/g, '');
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      const b64 = body.includes(',') ? body.split(',')[1] : body;
      const out = path.join(ROOT, 'tools', name);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(b64, 'base64'));
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('saved ' + name);
    });
    return;
  }

  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 ' + p); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
}).listen(PORT, () => console.log('pro-max-hub → http://localhost:' + PORT));
