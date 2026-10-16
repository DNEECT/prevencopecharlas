import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL || 'https://betgsxbtyckbbiepmols.supabase.co';
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)
    && !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(url)) {
  throw new Error('SUPABASE_URL must be a Supabase HTTPS URL or a localhost development URL.');
}
if (publishableKey && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
  throw new Error('Use a modern sb_publishable_ key; never provide a service-role or secret key.');
}
if (process.env.VERCEL && !publishableKey) {
  throw new Error('Set SUPABASE_PUBLISHABLE_KEY in the Vercel project before deploying.');
}

mkdirSync('src/environments', { recursive: true });
writeFileSync('src/environments/supabase.generated.ts',
  `// Generated at build time. This file contains only browser-public configuration.\n` +
  `export const supabaseConfig = ${JSON.stringify({ url, publishableKey })} as const;\n`,
);
