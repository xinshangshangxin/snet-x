import { BrowserWindow } from 'electron';
import windowStateKeeper from 'electron-window-state';

import { isDev, loadUrl } from '../shared/project/env';

function createWindow(isShow = false): BrowserWindow {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600,
  });

  const win = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: !!isDev,
    },
    show: isShow,
    titleBarStyle: 'hidden',
  });

  mainWindowState.manage(win);

  win.loadURL(loadUrl);

  if (isDev) {
    win.webContents.openDevTools();
  }

  return win;
}

export { createWindow };
