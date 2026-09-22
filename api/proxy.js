const { randomUUID } = require('crypto');
const { URL } = require('url');

// Handler serverless para Vercel (o cualquier plataforma compatible con Node 18+)
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function getAllowedHosts() {
  const env = process.env.BACKEND_ALLOWED_HOSTS || 'prevencope.actividades.api.fordevs.pe';
  return env
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getAllowedOrigins() {
  const env =
    process.env.ALLOWED_ORIGINS ||
    [
      'https://prevencopecharlas.vercel.app',
      'https://prevencopecharlas-charlas.vercel.app',
      'https://prevencopecharlas-git-supabase-migration-charlas.vercel.app',
      'https://app-prevencope.vercel.app',
      'http://localhost:4200',
    ].join(',');
  return env
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin) {
  try {
    const normalized = new URL(origin).origin;
    return getAllowedOrigins().includes(normalized);
  } catch {
    return false;
  }
}

function isHostAllowed(targetUrl) {
  try {
    const u = new URL(targetUrl);
    const host = u.host;
    const allowed = getAllowedHosts();
    if (allowed.length === 0) return false;
    return allowed.some((a) => host === a || host.endsWith('.' + a));
  } catch (e) {
    return false;
  }
}

function buildForwardHeaders(req) {
  const headers = {};
  const h = req.headers || {};

  if (h['authorization']) headers['authorization'] = h['authorization'];

  const incomingTx = h['transaccion-id'] || h['transaccion-id'.toLowerCase()];
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (incomingTx && uuidPattern.test(incomingTx)) {
    headers['transaccion-id'] = incomingTx;
  } else {
    headers['transaccion-id'] =
      typeof randomUUID === 'function' ? randomUUID() : 'tx-' + Date.now();
  }

  headers['nombre-aplicacion'] = h['nombre-aplicacion'] || h['Nombre-Aplicacion'] || 'SGCS';

  if (h['ngrok-skip-browser-warning'])
    headers['ngrok-skip-browser-warning'] = h['ngrok-skip-browser-warning'];
  if (h['content-type']) headers['content-type'] = h['content-type'];
  if (h['user-agent']) headers['user-agent'] = h['user-agent'];
  if (h['accept-language']) headers['accept-language'] = h['accept-language'];

  headers['accept'] = h['accept'] || 'application/json';

  return headers;
}

module.exports = async (req, res) => {
  try {
    // This proxy is a temporary migration bridge. Only known frontends may call it.
    const origin = req.headers.origin;
    if (origin && !isOriginAllowed(origin)) {
      console.warn('[api/proxy] rejected origin', { origin });
      res.statusCode = 403;
      return res.end('Origin not allowed');
    }

    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type,Authorization,Transaccion-Id,Nombre-Aplicacion,ngrok-skip-browser-warning,X-Original-Url,X-Original-Method,X-Use-Cache,X-Cache-TTL',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'false');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const rawBody = await getRawBody(req);

    // Obtener target
    const targetFromHeader = req.headers['x-original-url'];
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const targetFromQuery = parsedUrl.searchParams.get('url');

    let target = targetFromHeader || targetFromQuery;
    if (!target) {
      res.statusCode = 400;
      return res.end('Missing target URL (X-Original-Url header or ?url query)');
    }

    // Para GET con query params: agregar los params adicionales a la URL target
    // Los params que NO son 'url' se pasan al target
    if (targetFromQuery) {
      const targetUrlObj = new URL(target);
      for (const [key, value] of parsedUrl.searchParams.entries()) {
        if (key !== 'url') {
          targetUrlObj.searchParams.append(key, value);
        }
      }
      target = targetUrlObj.toString();
    }

    const originalMethod = (req.headers['x-original-method'] || req.method).toUpperCase();

    if (!isHostAllowed(target)) {
      res.statusCode = 403;
      return res.end('Target host not allowed');
    }

    const forwardHeaders = buildForwardHeaders(req);

    const targetUrl = new URL(target);
    forwardHeaders['host'] = targetUrl.host;

    // Never log URLs, request bodies, authorization values, or personal data.
    console.log('[api/proxy] forwarding', originalMethod, 'to', targetUrl.host);

    const fetchOptions = {
      method: originalMethod,
      headers: forwardHeaders,
      redirect: 'manual',
      body:
        originalMethod === 'GET' || originalMethod === 'HEAD'
          ? undefined
          : rawBody && rawBody.length
            ? rawBody
            : undefined,
    };

    const r = await fetch(target, fetchOptions);

    res.statusCode = r.status;

    r.headers.forEach((value, key) => {
      const forbidden = [
        'connection',
        'keep-alive',
        'transfer-encoding',
        'upgrade',
        'proxy-authorization',
        'proxy-authenticate',
        'set-cookie',
      ];
      if (forbidden.includes(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'false');

    const arrayBuffer = await r.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.end(buffer);
  } catch (err) {
    console.error('[api/proxy] error', err);
    res.statusCode = 502;
    res.end('Bad Gateway');
  }
};
