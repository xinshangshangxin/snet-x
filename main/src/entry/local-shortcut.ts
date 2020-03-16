import { BrowserWindow } from 'electron';
import localShortcut from 'electron-localshortcut';

import { instance, QuitAppStatus } from './instance';

function register(win: BrowserWindow) {
  localShortcut.register(win, 'Cmd+Q', () => {
    instance.quitAppStatus = QuitAppStatus.block;

    setTimeout(() => {
      win.close();
    }, 0);
  });
}

export { register };
