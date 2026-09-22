const assert = require('node:assert/strict');
const proxyHandler = require('../api/proxy');

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    end(body) {
      this.body = body;
      return this;
    },
  };
}

async function preflight(origin) {
  const req = {
    method: 'OPTIONS',
    url: '/api/proxy',
    headers: { origin, host: 'prevencopecharlas.vercel.app' },
  };
  const res = response();
  await proxyHandler(req, res);
  return res;
}

delete process.env.ALLOWED_ORIGINS;

(async () => {
  const production = await preflight('https://prevencopecharlas.vercel.app');
  assert.equal(production.statusCode, 204);
  assert.equal(
    production.headers['Access-Control-Allow-Origin'],
    'https://prevencopecharlas.vercel.app',
  );

  const preview = await preflight(
    'https://prevencopecharlas-git-supabase-migration-charlas.vercel.app',
  );
  assert.equal(preview.statusCode, 204);

  const rejected = await preflight('https://example.invalid');
  assert.equal(rejected.statusCode, 403);
  assert.equal(rejected.body, 'Origin not allowed');

  console.log(
    JSON.stringify({
      production_origin_allowed: true,
      migration_preview_origin_allowed: true,
      unknown_origin_denied: true,
    }),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
