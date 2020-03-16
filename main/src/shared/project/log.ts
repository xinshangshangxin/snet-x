import { app } from 'electron';
import log from 'electron-log';
import { join } from 'path';

import { isDev } from './env';

if (!isDev) {
  log.transports.file.resolvePath = (variables) => {
    return join(app.getPath('logs'), variables.fileName || 'main.log');
  };
  Object.assign(console, log.functions);
}
