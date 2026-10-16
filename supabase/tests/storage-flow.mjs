// Local-only end-to-end Storage check. Run after a fresh `supabase db reset --local --no-seed`.
// It loads and commits disposable authorization fixtures; reset again to clean them up.
import { createHmac, randomUUID } from 'node:crypto';
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const cwd = process.cwd();
const status = JSON.parse(
  execSync('npx --no-install supabase status --output json', {
    cwd,
    encoding: 'utf8',
  }),
);
if (!status.API_URL?.startsWith('http://127.0.0.1:55321')) {
  throw new Error('This test only runs against the dedicated PREVENCOPE local stack.');
}

const fixture = readFileSync('supabase/tests/authorization.sql', 'utf8')
  .split('-- POST-STORAGE SQL VERIFICATION:')[0] + 'commit;\n';
const setup = spawnSync(
  'docker.exe',
  ['exec', '-i', 'supabase_db_prevencopecharlas', 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-q'],
  { input: fixture, encoding: 'utf8' },
);
if (setup.status !== 0) throw new Error(`Local fixture setup failed: ${setup.stderr}`);

function token(userId) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    aud: 'authenticated',
    exp: now + 600,
    iat: now,
    iss: 'supabase',
    sub: userId,
    role: 'authenticated',
    aal: 'aal1',
    session_id: randomUUID(),
    is_anonymous: false,
  })}`;
  return `${unsigned}.${createHmac('sha256', status.JWT_SECRET).update(unsigned).digest('base64url')}`;
}

const monitor = token('00000000-0000-4000-8000-000000000201');
const gestor = token('00000000-0000-4000-8000-000000000202');
const own = '00000000-0000-4000-8000-000000000235';
const other = '00000000-0000-4000-8000-000000000236';
const base = `${status.API_URL}/storage/v1/object`;
const name = `${own}/attendance-list/${randomUUID()}.pdf`;
const data = Buffer.from('%PDF-1.4\n% disposable local fixture\n');

async function request(method, path, bearer, body, contentType) {
  return fetch(`${base}/${path}`, {
    method,
    headers: {
      apikey: status.ANON_KEY,
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
      ...(contentType ? { 'content-type': contentType } : {}),
    },
    body,
  });
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const upload = await request('POST', `activity-evidence/${name}`, gestor, data, 'application/pdf');
assert(upload.ok, `Authorized upload failed: ${upload.status} ${await upload.text()}`);

const crossUpload = await request(
  'POST', `activity-evidence/${other}/attendance-list/${randomUUID()}.pdf`, gestor, data, 'application/pdf',
);
assert(!crossUpload.ok, 'Gestor uploaded into another creator’s activity');

const photoPdf = await request(
  'POST', `activity-evidence/${own}/photographic-record/${randomUUID()}.pdf`, gestor, data, 'application/pdf',
);
assert(!photoPdf.ok, 'New photographic PDF upload was accepted');

const tooLarge = await request(
  'POST', `activity-evidence/${own}/attendance-list/${randomUUID()}.pdf`, gestor,
  Buffer.alloc(20 * 1024 * 1024 + 1), 'application/pdf',
);
assert(!tooLarge.ok, 'Object larger than 20 MiB was accepted');

const anon = await request('GET', `authenticated/activity-evidence/${name}`, null);
assert(!anon.ok, 'Anonymous authenticated-object download succeeded');

const crossSign = await request(
  'POST', `sign/activity-evidence/${name}`, token('00000000-0000-4000-8000-000000000203'),
  JSON.stringify({ expiresIn: 30 }), 'application/json',
);
assert(!crossSign.ok, 'Out-of-scope user signed an object URL');

const signed = await request(
  'POST', `sign/activity-evidence/${name}`, gestor,
  JSON.stringify({ expiresIn: 30 }), 'application/json',
);
if (!signed.ok) throw new Error(`Authorized signed URL failed: ${signed.status} ${await signed.text()}`);
const signedData = await signed.json();
const signedDownload = await fetch(new URL(`/storage/v1${signedData.signedURL}`, status.API_URL));
assert(signedDownload.ok, `Signed download failed: ${signedDownload.status}`);
assert(Buffer.from(await signedDownload.arrayBuffer()).equals(data), 'Signed object data mismatch');

const metadataHeaders = {
  apikey: status.PUBLISHABLE_KEY,
  authorization: `Bearer ${gestor}`,
  'content-type': 'application/json',
};
const metadata = await fetch(`${status.API_URL}/rest/v1/activity_evidence`, {
  method: 'POST', headers: metadataHeaders,
  body: JSON.stringify({ activity_id: own, kind: 'attendance-list', object_path: name,
    original_name: 'local.pdf', mime_type: 'application/pdf', byte_size: data.length,
    is_available: true }),
});
assert(metadata.ok, `Evidence metadata insert failed: ${metadata.status}`);
const replacement = `${own}/attendance-list/${randomUUID()}.pdf`;
const replacementUpload = await request('POST', `activity-evidence/${replacement}`,
  gestor, data, 'application/pdf');
assert(replacementUpload.ok, `Replacement object upload failed: ${replacementUpload.status}`);
const archive = await fetch(`${status.API_URL}/rest/v1/rpc/archive_evidence`, {
  method: 'POST', headers: metadataHeaders,
  body: JSON.stringify({ p_activity_id: own, p_object_path: name }),
});
assert(archive.ok, `Evidence metadata archival failed: ${archive.status} ${await archive.text()}`);
const removal = await request('DELETE', `activity-evidence/${name}`, gestor);
assert(removal.ok, `Archived object removal failed: ${removal.status}`);
const missing = await request('POST', `sign/activity-evidence/${name}`, gestor,
  JSON.stringify({ expiresIn: 30 }), 'application/json');
assert(!missing.ok, 'Removed evidence object could still be signed');

const legacyPath = `${other}/photographic-record/${randomUUID()}.pdf`;
const legacy = await request(
  'POST', `activity-evidence/${legacyPath}`, status.SERVICE_ROLE_KEY, data, 'application/pdf',
);
assert(legacy.ok, `Controlled legacy PDF import failed: ${legacy.status} ${await legacy.text()}`);
const monitorSign = await request(
  'POST', `sign/activity-evidence/${legacyPath}`, monitor,
  JSON.stringify({ expiresIn: 30 }), 'application/json',
);
assert(monitorSign.ok, `Monitor could not sign imported PDF: ${monitorSign.status}`);

console.log('Storage flow passed: private access, role scope, kind and size limits, signed download, legacy PDF.');
