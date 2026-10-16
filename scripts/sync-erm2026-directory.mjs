import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

const ERM_PROCESS_ID = '57e96d43-5283-482b-a916-e21d72c7d605';
const apply = process.argv.includes('--apply');
const workbookArgument = process.argv.find((argument) => argument.toLowerCase().endsWith('.xlsx'));

if (!workbookArgument) {
  throw new Error('Provide the ERM 2026 directory .xlsx path.');
}

const url = process.env['SUPABASE_URL']?.trim();
const secretKey = process.env['SUPABASE_SECRET_KEY']?.trim();
if (!url || new URL(url).hostname !== 'betgsxbtyckbbiepmols.supabase.co') {
  throw new Error('SUPABASE_URL must identify the reviewed PREVENCOPE project.');
}
if (!secretKey?.startsWith('sb_secret_')) {
  throw new Error('SUPABASE_SECRET_KEY is required.');
}

const clean = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
const key = (value) =>
  clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const text = (cell) => clean(cell?.text ?? cell?.value);
const client = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(resolve(workbookArgument));
const jeeSheet = workbook.getWorksheet('JEE_GPCC');
const monitorSheet = workbook.getWorksheet('Monitores');
if (!jeeSheet || !monitorSheet) throw new Error('Expected JEE_GPCC and Monitores worksheets.');

const jeeRows = [];
for (let rowNumber = 2; rowNumber <= jeeSheet.rowCount; rowNumber += 1) {
  const row = jeeSheet.getRow(rowNumber);
  if (!text(row.getCell(3))) continue;
  jeeRows.push({
    number: Number(text(row.getCell(1))),
    department: text(row.getCell(2)),
    jee: text(row.getCell(3)),
    paternalSurname: text(row.getCell(4)),
    maternalSurname: text(row.getCell(5)),
    names: text(row.getCell(6)),
    email: text(row.getCell(7)).toLowerCase(),
    dni: text(row.getCell(8)),
    monitorName: text(row.getCell(9)),
  });
}

const monitorRows = [];
for (let rowNumber = 2; rowNumber <= monitorSheet.rowCount; rowNumber += 1) {
  const row = monitorSheet.getRow(rowNumber);
  if (!text(row.getCell(3))) continue;
  monitorRows.push({
    name: text(row.getCell(1)),
    role: text(row.getCell(2)),
    email: text(row.getCell(3)).toLowerCase(),
    dni: text(row.getCell(4)),
  });
}

if (jeeRows.length !== 91 || new Set(jeeRows.map((row) => key(row.jee))).size !== 91) {
  throw new Error('The directory must contain exactly 91 unique JEE rows.');
}
if (monitorRows.filter((row) => row.role === 'Monitor').length !== 16) {
  throw new Error('The directory must contain exactly 16 Monitor rows.');
}

const monitorByName = new Map(monitorRows.map((row) => [key(row.name), row]));
for (const row of jeeRows) {
  if (!monitorByName.has(key(row.monitorName))) {
    throw new Error(`Monitor directory mismatch at JEE row ${row.number}.`);
  }
}

async function requireData(promise, step) {
  const result = await promise;
  if (result.error) throw new Error(`${step}: ${result.error.message}`);
  return result.data;
}

async function listAuthUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const data = await requireData(
      client.auth.admin.listUsers({ page, perPage: 1000 }),
      'list Auth users',
    );
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

const [authUsers, profiles, roles, juries] = await Promise.all([
  listAuthUsers(),
  requireData(
    client.from('profiles').select('id,email,username,is_active,document_number'),
    'read profiles',
  ),
  requireData(
    client.from('roles').select('id,name').in('name', ['Gestor', 'Monitor']),
    'read roles',
  ),
  requireData(
    client.from('special_juries').select('id,jury_name').eq('electoral_process_id', ERM_PROCESS_ID),
    'read ERM juries',
  ),
]);

const authByEmail = new Map(authUsers.map((user) => [user.email?.toLowerCase(), user]));
const profileByEmail = new Map(profiles.map((profile) => [profile.email.toLowerCase(), profile]));
const roleByName = new Map(roles.map((role) => [role.name, role.id]));
const juryByName = new Map(juries.map((jury) => [key(jury.jury_name), jury.id]));

if (juryByName.size !== 91) throw new Error('Supabase does not contain the 91 ERM 2026 JEE rows.');
if (!roleByName.has('Gestor') || !roleByName.has('Monitor'))
  throw new Error('Required roles are missing.');

const accounts = [
  ...jeeRows
    .filter((row) => row.names && row.dni)
    .map((row) => ({
      email: row.email,
      username: row.email.split('@')[0].slice(0, 20),
      firstNames: row.names,
      lastNames: [row.paternalSurname, row.maternalSurname].filter(Boolean).join(' '),
      documentNumber: row.dni,
      role: 'Gestor',
    })),
  ...monitorRows.map((row) => ({
    email: row.email,
    username: row.email.split('@')[0].slice(0, 20),
    firstNames: row.name,
    lastNames: '',
    documentNumber: row.dni,
    role: 'Monitor',
  })),
];

const uniqueAccounts = [...new Map(accounts.map((account) => [account.email, account])).values()];
const plan = {
  workbookJuries: jeeRows.length,
  workbookMonitors: monitorRows.filter((row) => row.role === 'Monitor').length,
  accountsReviewed: uniqueAccounts.length,
  authUsersToCreate: uniqueAccounts.filter((account) => !authByEmail.has(account.email)).length,
  profilesToCreate: uniqueAccounts.filter((account) => !profileByEmail.has(account.email)).length,
  profilesToReactivate: uniqueAccounts.filter(
    (account) => profileByEmail.get(account.email)?.is_active === false,
  ).length,
  pendingContractorAccountsSkipped: jeeRows.filter((row) => !row.names || !row.dni).length,
  invitationsSent: 0,
};

if (!apply) {
  console.log(JSON.stringify({ mode: 'dry-run', ...plan }, null, 2));
  process.exit(0);
}

const profileIdByEmail = new Map();
let authUsersCreated = 0;
let profilesCreated = 0;
let profilesReactivated = 0;

for (const account of uniqueAccounts) {
  let authUser = authByEmail.get(account.email);
  if (!authUser) {
    const password = `${randomBytes(24).toString('base64url')}Aa1!`;
    const created = await requireData(
      client.auth.admin.createUser({
        email: account.email,
        password,
        email_confirm: true,
        user_metadata: { username: account.username },
        app_metadata: { onboarding_state: 'pending_invitation', source: 'erm2026_directory' },
      }),
      'create Auth user',
    );
    authUser = created.user;
    authUsersCreated += 1;
  }

  const existingProfile = profileByEmail.get(account.email);
  if (!existingProfile) {
    await requireData(
      client.from('profiles').insert({
        id: authUser.id,
        username: account.username,
        email: account.email,
        first_names: account.firstNames,
        last_names: account.lastNames,
        document_number: account.documentNumber,
        is_active: true,
      }),
      'create profile',
    );
    profilesCreated += 1;
  } else if (!existingProfile.is_active) {
    await requireData(
      client.from('profiles').update({ is_active: true }).eq('id', existingProfile.id),
      'reactivate profile',
    );
    profilesReactivated += 1;
  }

  const profileId = existingProfile?.id ?? authUser.id;
  profileIdByEmail.set(account.email, profileId);
  await requireData(
    client.from('profile_roles').upsert(
      {
        profile_id: profileId,
        role_id: roleByName.get(account.role),
        is_active: true,
      },
      { onConflict: 'profile_id,role_id' },
    ),
    'assign application role',
  );
}

const assignmentPairs = new Map();
for (const row of jeeRows) {
  const juryId = juryByName.get(key(row.jee));
  const gpccProfileId = profileIdByEmail.get(row.email);
  if (gpccProfileId)
    assignmentPairs.set(`${gpccProfileId}:${juryId}`, {
      profile_id: gpccProfileId,
      special_jury_id: juryId,
      is_active: true,
    });
  const monitor = monitorByName.get(key(row.monitorName));
  const monitorProfileId = profileIdByEmail.get(monitor.email);
  assignmentPairs.set(`${monitorProfileId}:${juryId}`, {
    profile_id: monitorProfileId,
    special_jury_id: juryId,
    is_active: true,
  });
}

const scopedProfileIds = [...new Set([...assignmentPairs.values()].map((item) => item.profile_id))];
await requireData(
  client
    .from('profile_jury_assignments')
    .update({ is_active: false })
    .in('profile_id', scopedProfileIds)
    .in('special_jury_id', [...juryByName.values()]),
  'clear previous ERM assignments',
);
await requireData(
  client
    .from('profile_jury_assignments')
    .upsert([...assignmentPairs.values()], { onConflict: 'profile_id,special_jury_id' }),
  'write ERM assignments',
);

console.log(
  JSON.stringify(
    {
      mode: 'apply',
      ...plan,
      authUsersCreated,
      profilesCreated,
      profilesReactivated,
      activeAssignments: assignmentPairs.size,
      invitationsSent: 0,
    },
    null,
    2,
  ),
);
