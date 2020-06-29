import { app } from 'electron';
import { noop } from 'lodash';

import { isDev } from '../shared/project/env';
import { getStatus, initDatabase } from '../storage';
import { addTray } from './add-tray-listener';
import { dealPermission } from './deal-permission';
import { instance, QuitAppStatus } from './instance';
import { onResume } from './power-monitor';
import { showWindow } from './show-window';
import { ensureStorePaths } from '../storage/store-path';

async function ready() {
  // 初始化存储路径
  await ensureStorePaths();
  // 初始化数据库
  await initDatabase();

  const { snet } = instance;
  const status = await getStatus();

  // tray 构建
  await snet.tray.startup(status);
  addTray();

  if (isDev) {
    showWindow();
  }

  // 监控系统恢复
  onResume().subscribe(noop, console.warn);

  // 检查是否初始化过
  if (!status.inited) {
    instance.redirectSubject.next('init');
    showWindow();

    return;
  }

  // 检查权限
  const invalid = await dealPermission();

  if (!invalid) {
    // 恢复 snet 上次状态
    await snet.startup();
  }
}

async function beforeQuit(e: Event) {
  const { snet, router, quitAppStatus } = instance;
  console.info('beforeQuit, status: ', quitAppStatus);

  if (quitAppStatus === QuitAppStatus.block) {
    e.preventDefault();
    instance.quitAppStatus = QuitAppStatus.delay;
  } else if (quitAppStatus === QuitAppStatus.allow) {
    console.info('quit app');
  } else {
    // 先阻止退出
    e.preventDefault();

    // 尝试先停止snet
    await snet.stop({ persistStatus: false });

    // 清除 render 消息监听
    router?.destroy();
    instance.router = null;

    // 标注为可以退出
    instance.quitAppStatus = QuitAppStatus.allow;

    // 重新触发退出事件
    app.quit();
  }
}

app.on('ready', ready);
app.on('activate', showWindow);
app.on('before-quit', beforeQuit);

app.on('window-all-closed', () => {
  instance.win = null;

  app.dock.hide();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
