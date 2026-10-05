import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve('dist/angular-template/browser');
const defaultHeadersFile = path.resolve('docs/security/security-headers.example.txt');

export function loadSecurityHeaders(filePath = defaultHeadersFile) {
  const headers = {};

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf(':');

    if (separator <= 0) {
      continue;
    }

    headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  return headers;
}

export function contentTypeFor(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
    case '.mjs':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.ico':
      return 'image/x-icon';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

export function cacheControlFor(filePath) {
  const basename = path.basename(filePath);

  if (basename === 'index.html') {
    return 'no-store';
  }

  if (/[-.][A-Z0-9]{8,}\.(?:js|css)$/i.test(basename)) {
    return 'public, max-age=31536000, immutable';
  }

  return 'no-cache';
}

export function createSecurityBaselineServer({
  root = defaultRoot,
  headers = loadSecurityHeaders(),
} = {}) {
  const resolvedRoot = path.resolve(root);

  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const candidate = path.resolve(resolvedRoot, relativePath);

    for (const [name, value] of Object.entries(headers)) {
      response.setHeader(name, value);
    }

    if (candidate !== resolvedRoot && !candidate.startsWith(`${resolvedRoot}${path.sep}`)) {
      response.writeHead(400, {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      });
      response.end('Bad request');
      return;
    }

    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
      response.writeHead(404, {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      });
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Cache-Control': cacheControlFor(candidate),
      'Content-Type': contentTypeFor(candidate),
    });
    fs.createReadStream(candidate).pipe(response);
  });
}

function main() {
  const port = Number(process.env['PORT'] ?? 4173);
  const root = path.resolve(process.env['SECURITY_DAST_ROOT'] ?? defaultRoot);
  const server = createSecurityBaselineServer({ root });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Security DAST server listening on http://127.0.0.1:${port}`);
  });
}

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main();
}
