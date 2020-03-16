const path = require('path');
const { app } = require('electron');
const isDev = require('electron-is-dev');

if (isDev) {
  // 开发环境下 警告注释
  app.allowRendererProcessReuse = true;

  // typescript
  require('ts-node').register({
    logError: true,
  });

  // 自动重启 electron
  if (process.env.reload) {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
      forceHardReset: true,
    });
  }
}

// 真正入口
require('./index.ts');
