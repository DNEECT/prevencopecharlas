import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (
  args.some(
    (arg) => arg === '-Q' || arg === '--global-config' || arg.startsWith('--global-config='),
  )
) {
  throw new Error('PREVENCOPE manages an isolated Vercel config; omit --global-config.');
}

const configuredDir = process.env['PREVENCOPE_VERCEL_CONFIG_DIR']?.trim();
const defaultDir =
  process.platform === 'win32' && process.env['APPDATA']
    ? join(process.env['APPDATA'], 'com.vercel.cli-prevencope')
    : join(homedir(), '.config', 'vercel-prevencope');
const configDir = configuredDir || defaultDir;
const xdgDataRoot = join(configDir, 'data');
const xdgConfigRoot = join(configDir, 'config');
const xdgCacheRoot = join(configDir, 'cache');
const xdgStateRoot = join(configDir, 'state');
mkdirSync(join(xdgDataRoot, 'com.vercel.cli'), { recursive: true });
const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const cliEntry = join(repositoryRoot, 'node_modules', 'vercel', 'dist', 'vc.js');

const child = spawn(process.execPath, [cliEntry, ...args], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    XDG_CACHE_HOME: xdgCacheRoot,
    XDG_CONFIG_HOME: xdgConfigRoot,
    XDG_DATA_HOME: xdgDataRoot,
    XDG_STATE_HOME: xdgStateRoot,
  },
  stdio: 'inherit',
  windowsHide: true,
});

child.once('error', (error) => {
  console.error(`Unable to start the project-local Vercel CLI: ${error.message}`);
  process.exitCode = 1;
});
child.once('exit', (code, signal) => {
  if (signal) {
    console.error(`Vercel CLI stopped with signal ${signal}.`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
