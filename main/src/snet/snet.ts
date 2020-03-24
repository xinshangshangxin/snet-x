import { createWriteStream, ensureFile, writeJSON } from 'fs-extra';
import { escapeRegExp } from 'lodash';

import { Errors } from '../shared/project/error';
import { treeProcessIds } from '../shared/shell/ps-tree';
import { Signal, sudoRun } from '../shared/shell/sudo-run';
import { getStatus, saveStatus } from '../storage';
import { snetConfigPath, snetLogPath } from '../storage/store-path';
import { notifyRunning, notifyStopped } from '../utils/notification';
import { getConfig } from './config';
import { Core } from './snet-core';
import { SnetTray } from './tray';

class Snet extends Core {
  constructor(public tray = new SnetTray()) {
    super();
  }

  public async startup() {
    console.info('startup...');

    console.debug('创建 snet 日志文件');
    await ensureFile(snetLogPath);

    console.debug('第一次启动, 先尝试停止上一次可能的残留');
    await this.stop({ persistStatus: false });

    const status = await getStatus();

    console.debug('启动检查上次是否在运行状态', { status });
    if (status?.running) {
      await this.start();
    }

    console.info('startup done');
  }

  public async start({ configId, notify = false }: { configId?: string; notify?: boolean } = {}) {
    const config = await getConfig(configId);

    if (!config) {
      throw new Errors.NoSnetConfigFound({ configId });
    }

    console.info('start run with configId: ', config._id);

    await writeJSON(snetConfigPath, config, {
      spaces: 2,
    });

    const stream = createWriteStream(snetLogPath, { flags: 'a' });

    await sudoRun.runAsync(`chmod +x "${this.snetPath}"`);

    const { child } = sudoRun.run(`"${this.snetPath}" -config "${snetConfigPath}"`, {
      stdio: 'pipe',
    });
    this.child = child;

    child.stdout?.pipe(stream);
    child.stderr?.pipe(stream);

    child.on('close', (code) => {
      stream.close();

      console.debug('child close with code: ', code);
      this.tray.changeStatus('stop');

      if (code === 1) {
        notifyStopped('Snet 未预期的崩溃', '请检查: 多次启动 / ss配置错误 / 端口被占用');
        saveStatus({ running: false }).catch(console.warn);
      }

      if (this.child?.pid === child.pid) {
        this.child = null;
      }
    });

    this.tray.changeStatus('start', config._id);

    await saveStatus({ running: true, configId: config._id });

    if (notify) {
      notifyRunning(config);
    }
  }

  public async stop({
    persistStatus = true,
    notify = false,
    cleanPf = false,
  }: { persistStatus?: boolean; notify?: boolean; cleanPf?: boolean } = {}) {
    console.info('stop run', { pid: this.child?.pid, snetPath: this.snetPath });

    if (this.child) {
      await sudoRun.killTree(this.child);
      this.child = null;
    }

    const ids = await treeProcessIds(new RegExp(escapeRegExp(this.snetPath)));
    if (ids.length) {
      console.debug('force kill', ids);
      await sudoRun.kill(ids, Signal.KILL);
    }

    this.tray.changeStatus('stop');

    if (cleanPf) {
      console.debug('cleanPf');
      // 清除本地 DNS
      await sudoRun.runAsync('killall -HUP mDNSResponder');
      // 清除 pf 规则
      await sudoRun.runAsync('pfctl -d', { stdio: 'pipe' });
    }

    if (persistStatus) {
      console.debug('save status stopped');
      await saveStatus({ running: false });
    }

    if (notify) {
      notifyStopped();
    }
  }
}

export { Snet };
