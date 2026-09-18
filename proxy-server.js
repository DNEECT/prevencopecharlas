const express = require('express');
const fetch = require('node-fetch');
const { randomUUID } = require('crypto');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 54733;

// Permitir payloads grandes si es necesario (usamos raw para reenviar exactamente lo que venga)
app.use(express.raw({ type: '*/*', limit: '20mb' }));

// MIDDLEWARE CORS GLOBAL: añade cabeceras CORS en todas las respuestas y responde a preflight
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Transaccion-Id,Nombre-Aplicacion,ngrok-skip-browser-warning,X-Original-Url,X-Original-Method,X-Use-Cache,X-Cache-TTL');
  // No enviamos credenciales por defecto; si quieres enviar cookies, configúralo a 'true'
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// CORS preflight (legacy) — queda para compatibilidad, aunque middleware global ya lo maneja
app.options('/proxy', (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Transaccion-Id,Nombre-Aplicacion,ngrok-skip-browser-warning,X-Original-Url,X-Original-Method,X-Use-Cache,X-Cache-TTL');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  return res.sendStatus(204);
});

function getAllowedHosts() {
  const raw = 'prevencope.actividades.api.fordevs.pe';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((e) => e.replace(/:\d+$/, ''));
}

function isHostAllowed(targetUrl) {
  try {
    const u = new URL(targetUrl);
    const host = u.hostname; // sin puerto
    const allowed = getAllowedHosts();
    if (allowed.length === 0) return false;
    const ok = allowed.some(a => host === a || host.endsWith('.' + a));
    if (!ok) console.warn('[proxy] isHostAllowed: host not allowed', { host, allowed });
    return ok;
  } catch (_) {
    return false;
  }
}

function buildForwardHeaders(req) {
  // Normalizamos y tomamos solo los headers que vienen del interceptor/cliente
  const headers = {};
  const h = req.headers || {};

  if (h['authorization']) headers['authorization'] = h['authorization'];

  // Transaccion-Id: usar si viene, si no generar uno válido
  const incomingTx = h['transaccion-id'] || h['transaccion-id'.toLowerCase()];
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (incomingTx && uuidPattern.test(incomingTx)) {
    headers['transaccion-id'] = incomingTx;
  } else {
    headers['transaccion-id'] = (typeof randomUUID === 'function') ? randomUUID() : ('tx-' + Date.now());
  }

  headers['nombre-aplicacion'] = h['nombre-aplicacion'] || h['Nombre-Aplicacion'] || 'SGCS';

  if (h['ngrok-skip-browser-warning']) headers['ngrok-skip-browser-warning'] = h['ngrok-skip-browser-warning'];
  if (h['content-type']) headers['content-type'] = h['content-type'];
  if (h['user-agent']) headers['user-agent'] = h['user-agent'];
  if (h['accept-language']) headers['accept-language'] = h['accept-language'];

  // Añadimos Accept si no viene
  headers['accept'] = h['accept'] || 'application/json';

  return headers;
}

async function forwardRequest(targetUrl, method, req, res) {
  console.log('[proxy] ->', method, targetUrl);

  const forwardHeaders = buildForwardHeaders(req);

  // Asegurarnos de enviar Host correcto (algunos servicios lo requieren)
  try {
    const u = new URL(targetUrl);
    forwardHeaders['host'] = u.host;
  } catch (e) {
    // ignore
  }

  // Debug: registrar headers de forma mínima en consola
  console.log('[proxy] forwardHeaders:', Object.keys(forwardHeaders));

  const fetchOptions = {
    method,
    headers: forwardHeaders,
    redirect: 'manual',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = req.body && req.body.length ? req.body : undefined;
  }

  try {
    const r = await fetch(targetUrl, fetchOptions);

    // Pasar status
    res.status(r.status);

    // Copiar cabeceras (filtrando hop-by-hop)
    r.headers.forEach((value, key) => {
      const forbidden = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-authorization', 'proxy-authenticate', 'set-cookie'];
      if (forbidden.includes(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    // Añadir cabeceras CORS para la app front
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'false');

    // Obtener body como buffer para reenviar y para debug si hay error
    const buffer = await r.buffer();
    if (r.status >= 400) {
      // Log truncated upstream error body para diagnóstico
      try {
        const text = buffer.toString('utf8');
        console.error('[proxy] upstream error status', r.status, 'body (truncated 2000):', text.length > 2000 ? text.slice(0, 2000) + '...' : text);
      } catch (e) {
        console.error('[proxy] could not parse upstream body for debug');
      }
    }

    return res.send(buffer);
  } catch (err) {
    console.error('[proxy] forward error', err);
    return res.status(502).send('Bad Gateway');
  }
}

// RUTAS para métodos con cuerpo: POST, PUT, PATCH, DELETE -> requieren X-Original-Url
async function handleNonGetProxy(req, res) {
  const original = req.headers['x-original-url'];
  if (!original) return res.status(400).send('Missing X-Original-Url header');
  const originalMethod = (req.headers['x-original-method'] || req.method).toUpperCase();
  return forwardRequest(original, originalMethod, req, res);
}

app.post('/proxy', handleNonGetProxy);
app.put('/proxy', handleNonGetProxy);
app.patch('/proxy', handleNonGetProxy);
app.delete('/proxy', handleNonGetProxy);

// GET /proxy?url=
app.get('/proxy', async (req, res) => {
  const raw = req.query.url;
  if (!raw) return res.status(400).send('Missing url parameter');

  // raw may be encoded; decode safely
  const decoded = Array.isArray(raw) ? raw[0] : raw;
  let targetStr;
  try {
    targetStr = decodeURIComponent(decoded);
  } catch (e) {
    // if decode fails, fall back to raw
    targetStr = decoded;
  }

  // Log de diagnóstico
  console.log('[proxy] GET /proxy received. raw url param:', decoded);
  console.log('[proxy] GET /proxy other query keys:', Object.keys(req.query).filter(k => k !== 'url'));

  try {
    const targetUrl = new URL(targetStr);

    // Anexar query params adicionales que vinieron al proxy
    for (const key of Object.keys(req.query)) {
      if (key === 'url') continue;
      const val = req.query[key];
      if (Array.isArray(val)) {
        for (const v of val) targetUrl.searchParams.append(key, v);
      } else if (val !== undefined && val !== null && val !== '') {
        targetUrl.searchParams.append(key, String(val));
      }
    }

    // Verificar host permitido
    if (!isHostAllowed(targetUrl.toString())) {
      console.warn('[proxy] GET /proxy rejected host:', targetUrl.hostname, 'allowed:', getAllowedHosts());
      return res.status(403).send('Target host not allowed');
    }

    console.log('[proxy] forwarding GET to:', targetUrl.toString());
    await forwardRequest(targetUrl.toString(), 'GET', req, res);
  } catch (e) {
    console.error('[proxy] invalid target url for GET', targetStr, e && e.message);
    return res.status(400).send('Invalid url parameter');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
  console.log('Allowed hosts:', getAllowedHosts().join(', '));
});
