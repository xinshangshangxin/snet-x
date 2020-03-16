import { app } from 'electron';
import { resolve } from 'path';

import { ensureFileSync } from 'fs-extra';
import { isDev } from '../shared/project/env';

let userData = app.getPath('userData');

if (isDev) {
  userData = resolve(__dirname, '../../.tmp');
}

const devLogDir = resolve(userData, 'logs');

export const snetConfigPath = resolve(userData, 'snet/config.json');

ensureFileSync(snetConfigPath);

export const logsDir = isDev ? devLogDir : app.getPath('logs');
export const snetLogPath = resolve(logsDir, 'snet.log');

export const dbDir = resolve(userData, 'nedb');

export const tempDir = resolve(userData, 'temp');

console.debug('userData: ', userData);
