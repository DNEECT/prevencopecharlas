import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = 'betgsxbtyckbbiepmols';
const PROJECT_URL = `https://${PROJECT_REF}.supabase.co`;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_HEADERS = [
  'legacy_user_id',
  'email',
  'username',
  'role',
  'is_active',
  'proposed_invite',
  'auth_user_id',
  'review_notes',
];

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (!name.startsWith('--')) throw new Error(`Unexpected argument: ${name}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
    values[name.slice(2)] = value;
    index += 1;
  }
  if (!['dry-run', 'apply'].includes(values.mode)) {
    throw new Error('--mode must be dry-run or apply.');
  }
  if (!values.input) throw new Error('--input is required.');
  if (values.mode === 'apply' && !values.output)
    throw new Error('--output is required in apply mode.');
  if (values.mode === 'apply' && values['confirm-project'] !== PROJECT_REF) {
    throw new Error(`--confirm-project must equal ${PROJECT_REF}.`);
  }
  return values;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error('The onboarding CSV has an unterminated quoted field.');
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.length > 0));
}

function readOnboarding(path) {
  const rows = parseCsv(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
  const headers = rows.shift();
  if (JSON.stringify(headers) !== JSON.stringify(EXPECTED_HEADERS)) {
    throw new Error('The onboarding CSV headers do not match the reviewed format.');
  }
  const records = rows.map((cells) =>
    Object.fromEntries(headers.map((name, index) => [name, cells[index] ?? ''])),
  );
  if (records.length !== 92) throw new Error('The reviewed onboarding CSV must contain 92 users.');

  const ids = new Set();
  const emails = new Set();
  const usernames = new Set();
  for (const record of records) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        record.legacy_user_id,
      )
    ) {
      throw new Error('The onboarding CSV contains an invalid legacy user ID.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      throw new Error('The onboarding CSV contains an invalid email address.');
    }
    if (!record.username || !['Monitor', 'Gestor'].includes(record.role)) {
      throw new Error('The onboarding CSV contains an invalid username or role.');
    }
    if (
      !['True', 'False'].includes(record.is_active) ||
      !['True', 'False'].includes(record.proposed_invite)
    ) {
      throw new Error('The onboarding CSV contains an invalid boolean value.');
    }
    if (record.auth_user_id || record.review_notes) {
      throw new Error('Review the prefilled Auth ID or review note before provisioning.');
    }
    const normalizedEmail = record.email.toLowerCase();
    const normalizedUsername = record.username.toLowerCase();
    if (
      ids.has(record.legacy_user_id) ||
      emails.has(normalizedEmail) ||
      usernames.has(normalizedUsername)
    ) {
      throw new Error('The onboarding CSV contains a duplicate ID, email, or username.');
    }
    ids.add(record.legacy_user_id);
    emails.add(normalizedEmail);
    usernames.add(normalizedUsername);
  }
  return records;
}

function outsideRepository(path, label) {
  const target = resolve(path);
  const location = relative(REPO, target);
  if (!location.startsWith('..') && location !== '') {
    throw new Error(`${label} must be outside the repository.`);
  }
  return target;
}

function csvCell(value) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

async function listAuthUsers(admin) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Unable to list Auth users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

const args = parseArguments(process.argv.slice(2));
const input = outsideRepository(args.input, 'The private onboarding CSV');
if (!existsSync(input)) throw new Error('The private onboarding CSV does not exist.');
const records = readOnboarding(input);
const summary = {
  mode: args.mode,
  reviewed_users: records.length,
  active_users: records.filter((record) => record.is_active === 'True').length,
  inactive_users: records.filter((record) => record.is_active === 'False').length,
  monitor_users: records.filter((record) => record.role === 'Monitor').length,
  gestor_users: records.filter((record) => record.role === 'Gestor').length,
  auth_users_created: 0,
  auth_users_reused: 0,
  auth_users_updated: 0,
  invitations_sent: 0,
  password_resets_sent: 0,
  database_changed: false,
};

if (args.mode === 'dry-run') {
  console.log(JSON.stringify(summary));
  process.exit(0);
}

const output = outsideRepository(args.output, 'The private Auth map');
if (existsSync(output)) throw new Error('The private Auth map already exists.');
const url = process.env.SUPABASE_URL?.trim();
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
if (url !== PROJECT_URL || !secretKey?.startsWith('sb_secret_')) {
  throw new Error('The reviewed PREVENCOPE URL and secret key are required.');
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});
const existingUsers = await listAuthUsers(admin);
const byEmail = new Map(existingUsers.map((user) => [user.email?.toLowerCase(), user]));
const mapping = [];

for (const record of records) {
  const normalizedEmail = record.email.toLowerCase();
  let authUser = byEmail.get(normalizedEmail);
  if (authUser) {
    const mappedLegacyId =
      authUser.app_metadata?.legacy_user_id ?? authUser.user_metadata?.legacy_user_id;
    if (mappedLegacyId && mappedLegacyId !== record.legacy_user_id) {
      throw new Error('An existing Auth identity has conflicting legacy metadata.');
    }
    const appMetadata = {
      ...authUser.app_metadata,
      legacy_user_id: record.legacy_user_id,
    };
    const userMetadata = { ...authUser.user_metadata, username: record.username };
    userMetadata.legacy_user_id = null;
    userMetadata.legacy_role = null;
    userMetadata.legacy_active = null;
    if (
      JSON.stringify(appMetadata) !== JSON.stringify(authUser.app_metadata) ||
      JSON.stringify(userMetadata) !== JSON.stringify(authUser.user_metadata)
    ) {
      const { data, error } = await admin.auth.admin.updateUserById(authUser.id, {
        app_metadata: appMetadata,
        user_metadata: userMetadata,
      });
      if (error) throw new Error(`Unable to normalize legacy Auth metadata: ${error.message}`);
      authUser = data.user;
      summary.auth_users_updated += 1;
    }
    summary.auth_users_reused += 1;
  } else {
    const password = `${randomBytes(36).toString('base64url')}Aa1!`;
    const { data, error } = await admin.auth.admin.createUser({
      email: record.email,
      password,
      email_confirm: true,
      app_metadata: { legacy_user_id: record.legacy_user_id },
      user_metadata: { username: record.username },
    });
    if (error) throw new Error(`Unable to create a legacy Auth identity: ${error.message}`);
    authUser = data.user;
    byEmail.set(normalizedEmail, authUser);
    summary.auth_users_created += 1;
  }
  mapping.push({ legacy_user_id: record.legacy_user_id, auth_user_id: authUser.id });
}

const outputText = [
  'legacy_user_id,auth_user_id',
  ...mapping.map((record) => `${csvCell(record.legacy_user_id)},${csvCell(record.auth_user_id)}`),
].join('\n');
writeFileSync(output, `${outputText}\n`, { encoding: 'utf8', flag: 'wx' });
summary.database_changed = summary.auth_users_created > 0 || summary.auth_users_updated > 0;
summary.private_auth_map_created = true;
console.log(JSON.stringify(summary));
