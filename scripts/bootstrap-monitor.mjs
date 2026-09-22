import { createClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']?.trim();
const publishableKey = process.env['SUPABASE_PUBLISHABLE_KEY']?.trim();
const secretKey = process.env['SUPABASE_SECRET_KEY']?.trim();
const email = process.env['BOOTSTRAP_MONITOR_EMAIL']?.trim().toLowerCase();
const username = process.env['BOOTSTRAP_MONITOR_USERNAME']?.trim();
const password = process.env['BOOTSTRAP_MONITOR_PASSWORD'];
const firstNames = process.env['BOOTSTRAP_MONITOR_FIRST_NAMES']?.trim() || username;
const lastNames = process.env['BOOTSTRAP_MONITOR_LAST_NAMES']?.trim() || '';

if (!url || new URL(url).hostname !== 'betgsxbtyckbbiepmols.supabase.co') {
  throw new Error('SUPABASE_URL must identify the reviewed PREVENCOPE project.');
}
if (!publishableKey?.startsWith('sb_publishable_')) {
  throw new Error('SUPABASE_PUBLISHABLE_KEY is required.');
}
if (!secretKey?.startsWith('sb_secret_')) {
  throw new Error('SUPABASE_SECRET_KEY is required.');
}
if (!email?.endsWith('@jne.gob.pe')) {
  throw new Error('BOOTSTRAP_MONITOR_EMAIL must be an institutional JNE address.');
}
if (!username || username.length > 20) {
  throw new Error('BOOTSTRAP_MONITOR_USERNAME must contain at most 20 characters.');
}
if (!password || password.length < 20) {
  throw new Error('BOOTSTRAP_MONITOR_PASSWORD must contain at least 20 characters.');
}

const options = {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
};
const admin = createClient(url, secretKey, options);
const client = createClient(url, publishableKey, options);
let userId;
let createdAuthUser = false;
let createdProfile = false;

function requireSuccess(result, step) {
  if (result.error) throw new Error(`${step}: ${result.error.message}`);
  return result.data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function findAuthUser() {
  for (let page = 1; ; page += 1) {
    const data = requireSuccess(
      await admin.auth.admin.listUsers({ page, perPage: 1000 }),
      'list Auth users',
    );
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match || data.users.length < 1000) return match;
  }
}

try {
  let authUser = await findAuthUser();
  if (!authUser) {
    const created = requireSuccess(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      }),
      'create Monitor Auth user',
    );
    authUser = created.user;
    createdAuthUser = true;
  }
  userId = authUser.id;

  const role = requireSuccess(
    await admin.from('roles').select('id,is_active').eq('name', 'Monitor').single(),
    'read Monitor role',
  );
  assert(role.is_active, 'The seeded Monitor role is inactive.');

  const profile = requireSuccess(
    await admin
      .from('profiles')
      .select('id,username,email,is_active')
      .eq('id', userId)
      .maybeSingle(),
    'read Monitor profile',
  );
  if (profile) {
    assert(profile.username.toLowerCase() === username.toLowerCase(), 'Username conflict.');
    assert(profile.email.toLowerCase() === email, 'Profile email conflict.');
    if (!profile.is_active) {
      requireSuccess(
        await admin.from('profiles').update({ is_active: true }).eq('id', userId),
        'reactivate Monitor profile',
      );
    }
  } else {
    requireSuccess(
      await admin.from('profiles').insert({
        id: userId,
        username,
        email,
        first_names: firstNames,
        last_names: lastNames,
        is_active: true,
      }),
      'create Monitor profile',
    );
    createdProfile = true;
  }

  requireSuccess(
    await admin
      .from('profile_roles')
      .upsert(
        { profile_id: userId, role_id: role.id, is_active: true },
        { onConflict: 'profile_id,role_id' },
      ),
    'assign Monitor role',
  );

  requireSuccess(
    await client.auth.signInWithPassword({ email, password }),
    'verify Monitor sign-in',
  );
  const roles = requireSuccess(await client.rpc('my_roles'), 'read current roles');
  const permissions = requireSuccess(
    await client.rpc('my_permissions'),
    'read current permissions',
  );
  assert(
    roles.some((item) => item.name === 'Monitor'),
    'Monitor role is not effective.',
  );
  assert(permissions.length > 0, 'Monitor permissions are missing.');

  const directRoleWrite = await client
    .from('profile_roles')
    .update({ is_active: false })
    .eq('profile_id', userId)
    .eq('role_id', role.id)
    .select('profile_id');
  const roleWriteDenied = Boolean(directRoleWrite.error) || directRoleWrite.data?.length === 0;
  assert(roleWriteDenied, 'Browser client unexpectedly changed role membership.');
  const membership = requireSuccess(
    await admin
      .from('profile_roles')
      .select('is_active')
      .eq('profile_id', userId)
      .eq('role_id', role.id)
      .single(),
    'recheck Monitor membership',
  );
  assert(membership.is_active, 'Monitor membership was changed during verification.');
  requireSuccess(await client.auth.signOut({ scope: 'local' }), 'sign out verification session');

  console.log(
    JSON.stringify({
      username,
      auth_user_created: createdAuthUser,
      profile_created: createdProfile,
      profile_active: true,
      monitor_active: true,
      permission_count: permissions.length,
      sign_in_verified: true,
      browser_role_write_denied: true,
      invitations_sent: 0,
    }),
  );
} catch (error) {
  await client.auth.signOut({ scope: 'local' });
  if (createdAuthUser && userId) {
    await admin.from('profile_roles').delete().eq('profile_id', userId);
    if (createdProfile) await admin.from('profiles').delete().eq('id', userId);
    await admin.auth.admin.deleteUser(userId);
  }
  throw error;
}
