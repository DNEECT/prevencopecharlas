// Local-only Data API/Auth check. Run on a fresh local reset; reset afterward.
import { randomUUID } from 'node:crypto';
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const status = JSON.parse(execSync('npx --no-install supabase status --output json', {
  encoding: 'utf8',
}));
if (!status.API_URL?.startsWith('http://127.0.0.1:55321')) {
  throw new Error('This check only runs against the dedicated PREVENCOPE local stack.');
}
const fixture = readFileSync('supabase/tests/authorization.sql', 'utf8')
  .split('-- POST-STORAGE SQL VERIFICATION:')[0] + 'commit;\n';
const setup = spawnSync('docker.exe',
  ['exec', '-i', 'supabase_db_prevencopecharlas', 'psql', '-X', '-v', 'ON_ERROR_STOP=1',
    '-U', 'postgres', '-d', 'postgres', '-q'],
  { input: fixture, encoding: 'utf8' });
if (setup.status !== 0) throw new Error(`Local fixture setup failed: ${setup.stderr}`);

const service = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const client = createClient(status.API_URL, status.PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
function check(ok, message) { if (!ok) throw new Error(message); }
const suffix = randomUUID();
const email = `gestor-${suffix}@example.invalid`;
const password = `Synthetic-${suffix}!`;
const nextPassword = `Updated-${suffix}!`;
const invalid = await client.auth.signInWithPassword({ email, password: 'wrong-password' });
check(!!invalid.error, 'Invalid credentials were accepted');

const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error || !created.data.user) throw created.error ?? new Error('User creation failed');
const id = created.data.user.id;
const profile = await service.from('profiles').insert({
  id, username: `smoke-${suffix.slice(0, 12)}`, email,
  first_names: 'Synthetic', last_names: 'Gestor',
});
if (profile.error) throw profile.error;
const membership = await service.from('profile_roles').insert({
  profile_id: id, role_id: '00000000-0000-4000-8000-000000000206',
});
if (membership.error) throw membership.error;

const signedIn = await client.auth.signInWithPassword({ email, password });
if (signedIn.error) throw signedIn.error;
const [self, roles, permissions, types] = await Promise.all([
  client.from('profiles').select('id').eq('id', id).single(),
  client.rpc('my_roles'), client.rpc('my_permissions'),
  client.from('activity_types').select('id,name'),
]);
check(self.data?.id === id && !self.error, 'Active profile unavailable');
check(roles.data?.some((role) => role.name === 'Gestor'), 'Role mapping failed');
check(permissions.data?.some((row) => row.module_abbreviation === 'GREGACT'
  && row.action_abbreviation === 'LIST'), 'Effective permission unavailable');
check(!permissions.data?.some((row) => row.action_abbreviation === 'DELETE'),
  'Inactive grant became active');
check(types.data?.some((row) => row.name === 'Type') && !types.error,
  `Active catalog read failed: ${types.error?.code ?? 'no-error'}`);
const unauthorized = await client.from('activity_types').insert({ name: 'Forbidden' });
check(!!unauthorized.error, 'Gestor catalog insert was accepted');

const counter = await service.from('activity_formats').update({ next_number: 3 })
  .eq('id', '00000000-0000-4000-8000-000000000234');
if (counter.error) throw counter.error;
const params = {
  p_format_id: '00000000-0000-4000-8000-000000000234',
  p_assistant_id: '00000000-0000-4000-8000-000000000230',
  p_target_id: '00000000-0000-4000-8000-000000000231',
  p_process_id: '00000000-0000-4000-8000-000000000232',
  p_jury_id: '00000000-0000-4000-8000-000000000233',
  p_place: 'Synthetic place', p_date: '2026-09-21', p_time: '12:30',
  p_participants: [{ dni: '12345678', nombresCompletos: 'Synthetic Person',
    sexo: 'F', edad: 30, organizacion: 'Synthetic Organization' }],
};
const createdActivity = await client.rpc('create_activity', params);
if (createdActivity.error) throw createdActivity.error;
const activityId = createdActivity.data?.[0]?.activity_id;
check(createdActivity.data?.[0]?.activity_code === 'FIX0003', 'Counter allocation mismatch');
const list = await client.from('activity_list').select('*');
check(list.data?.length === 1 && list.data[0].id === activityId
  && list.data[0].participant_count === 1, 'Gestor list/participant scope failed');
const replaced = await client.rpc('replace_activity', {
  p_activity_id: activityId, ...params, p_place: 'Changed place',
});
if (replaced.error) throw replaced.error;
const stillSameCode = await client.from('activity_list').select('code,place').eq('id', activityId).single();
check(stillSameCode.data?.code === 'FIX0003' && stillSameCode.data.place === 'Changed place',
  'Activity replacement changed code or failed');
const deniedArchive = await client.rpc('archive_activity', { p_activity_id: activityId });
check(!!deniedArchive.error, 'Inactive DELETE grant allowed archive');
const grantDelete = await service.from('role_module_actions').update({ is_active: true })
  .eq('id', '00000000-0000-4000-8000-000000000227');
if (grantDelete.error) throw grantDelete.error;
const crossArchive = await client.rpc('archive_activity', {
  p_activity_id: '00000000-0000-4000-8000-000000000236',
});
check(!!crossArchive.error, 'Gestor archived another creator’s activity');
const archived = await client.rpc('archive_activity', { p_activity_id: activityId });
if (archived.error) throw archived.error;
check((await client.from('activity_list').select('id')).data?.length === 0,
  'Archived activity remained visible');

const updated = await client.auth.updateUser({ password: nextPassword });
if (updated.error) throw updated.error;
const refreshed = await client.auth.refreshSession();
check(!!refreshed.data.session && !refreshed.error, 'Session refresh failed');
await client.auth.signOut();
check(!(await client.auth.getSession()).data.session, 'Sign-out retained session');
check(!!(await client.auth.signInWithPassword({ email, password: nextPassword })).data.user,
  'Updated password sign-in failed');

const disabled = await service.from('profiles').update({ is_active: false }).eq('id', id);
if (disabled.error) throw disabled.error;
const invisible = await client.from('profiles').select('id').eq('id', id).maybeSingle();
check(!invisible.data && !invisible.error, 'Disabled profile remained visible');
check((await client.rpc('my_permissions')).data?.length === 0,
  'Disabled profile retained permissions');
await client.auth.signOut();

console.log('Auth/Data API passed: login, profile, grants, catalog scope, activity RPC/list/edit/archive, refresh, password, sign-out, disable.');
