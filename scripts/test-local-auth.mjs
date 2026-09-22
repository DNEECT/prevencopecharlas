// Local-only Supabase Auth/RLS smoke test. No invitation or email is sent.
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.PREVENCOPE_LOCAL_SUPABASE_URL;
const publishableKey = process.env.PREVENCOPE_LOCAL_PUBLISHABLE_KEY;
const secretKey = process.env.PREVENCOPE_LOCAL_SECRET_KEY;
if (!url || !publishableKey || !secretKey || new URL(url).hostname !== '127.0.0.1'
    || new URL(url).port !== '55321') {
  throw new Error('Local Supabase URL and keys for port 55321 are required');
}

const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
const admin = createClient(url, secretKey, options);
const client = createClient(url, publishableKey, options);
const userEmail = `auth-fixture-${randomUUID()}@example.invalid`;
const oldPassword = `Old-${randomUUID()}!`;
const newPassword = `New-${randomUUID()}!`;
let userId;

function requireSuccess(result, step) {
  if (result.error) throw new Error(`${step}: ${result.error.message}`);
  return result.data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const created = requireSuccess(await admin.auth.admin.createUser({
    email: userEmail, password: oldPassword, email_confirm: true,
  }), 'create local Auth user');
  userId = created.user.id;
  const role = requireSuccess(
    await admin.from('roles').select('id').eq('name', 'Gestor').single(),
    'read Gestor role',
  );
  requireSuccess(await admin.from('profiles').insert({
    id: userId, username: `fixture-${userId.slice(0, 8)}`, email: userEmail,
    first_names: 'Local', last_names: 'Fixture', is_active: true,
  }), 'create local profile');
  requireSuccess(await admin.from('profile_roles').insert({
    profile_id: userId, role_id: role.id, is_active: true,
  }), 'assign local Gestor');

  const invalid = await client.auth.signInWithPassword({ email: userEmail, password: 'incorrect' });
  assert(!!invalid.error, 'Invalid password was accepted');
  requireSuccess(await client.auth.signInWithPassword({ email: userEmail, password: oldPassword }),
    'valid sign-in');
  assert(requireSuccess(await client.auth.getUser(), 'getUser').user.id === userId,
    'Valid session did not resolve the user');
  assert(!!requireSuccess(await client.from('profiles').select('id')
    .eq('id', userId).eq('is_active', true).maybeSingle(), 'active profile'),
    'Active profile not visible');
  const permissions = requireSuccess(await client.rpc('my_permissions'), 'permissions');
  assert(permissions.length > 0,
    'Gestor permissions missing');
  assert(!permissions.some(({ module_abbreviation, action_abbreviation }) =>
    module_abbreviation === 'GREGACT' && action_abbreviation === 'APROVE'),
    'Disabled Gestor grant appeared in navigation permissions');
  const deniedTypeWrite = await client.from('activity_types').insert({
    name: `unauthorized-${userId.slice(0, 8)}`,
  });
  assert(!!deniedTypeWrite.error, 'Gestor direct configuration write was accepted');
  assert(!!requireSuccess(await client.auth.refreshSession(), 'refresh session').session,
    'Session refresh failed');
  requireSuccess(await client.auth.updateUser({ password: newPassword }), 'password update');
  requireSuccess(await client.auth.signOut({ scope: 'local' }), 'sign out');
  assert(!(await client.auth.getUser()).data.user, 'Sign-out left an active user');
  assert(!!(await client.auth.signInWithPassword({ email: userEmail, password: oldPassword })).error,
    'Old password remained valid');
  requireSuccess(await client.auth.signInWithPassword({ email: userEmail, password: newPassword }),
    'new password sign-in');

  requireSuccess(await admin.from('profiles').update({ is_active: false }).eq('id', userId),
    'disable local profile');
  assert(!requireSuccess(await client.from('profiles').select('id')
    .eq('id', userId).eq('is_active', true).maybeSingle(), 'disabled profile check'),
    'Disabled profile remained visible');
  assert(requireSuccess(await client.rpc('my_permissions'), 'disabled permissions').length === 0,
    'Disabled profile retained permissions');
  requireSuccess(await client.auth.signOut({ scope: 'local' }), 'final sign out');
  console.log(JSON.stringify({ valid_login: true, invalid_login_denied: true,
    refresh: true, password_change: true, disabled_profile_denied: true,
    inactive_grant_hidden: true, direct_write_denied: true,
    sign_out: true, invitations_sent: 0 }));
} finally {
  if (userId) {
    await client.auth.signOut({ scope: 'local' });
    requireSuccess(await admin.from('profile_roles').delete().eq('profile_id', userId),
      'remove local membership');
    requireSuccess(await admin.from('profiles').delete().eq('id', userId),
      'remove local profile');
    requireSuccess(await admin.auth.admin.deleteUser(userId), 'remove local Auth user');
  }
}
