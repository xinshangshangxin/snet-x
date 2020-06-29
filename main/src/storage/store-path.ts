import { app } from 'electron';
import { ensureDir, ensureFile } from 'fs-extra';
import { resolve } from 'path';

import { isDev } from '../shared/project/env';

let userData = app.getPath('userData');

if (isDev) {
  userData = resolve(__dirname, '../../.tmp');
}

const devLogDir = resolve(userData, 'logs');

export const snetDir = resolve(userData, 'snet');
export const snetConfigPath = resolve(snetDir, 'config.json');

export const logsDir = isDev ? devLogDir : app.getPath('logs');
export const snetLogPath = resolve(logsDir, 'snet.log');
export const dnsLogPath = resolve(logsDir, 'dns.log');

export const dbDir = resolve(userData, 'nedb');

async function ensureStorePaths() {
  await Promise.all([ensureFile(snetConfigPath), ensureDir(logsDir), ensureDir(dbDir)]);
}

console.debug('userData: ', userData);

export { ensureStorePaths };
