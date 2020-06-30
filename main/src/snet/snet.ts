import { createWriteStream, ensureFile, writeJSON } from 'fs-extra';
import { escapeRegExp } from 'lodash';
import { v4 } from 'uuid';

import { defer, Deferred } from '../shared/defer';
import { GithubRelease } from '../shared/github-release';
import { Errors } from '../shared/project/error';
import { treeProcessIds } from '../shared/shell/ps-tree';
import { Signal, sudoRun } from '../shared/shell/sudo-run';
import { getStatus, saveStatus } from '../storage';
import { snetConfigPath, snetLogPath } from '../storage/store-path';
import { notifyRunning, notifyStopped } from '../utils/notification';
import { getConfig } from './config';
import { Core } from './snet-core';
import { SnetTray } from './tray';

interface StartConfig {
  configId?: string;
  notify?: boolean;
}

interface StopConfig {
  persistStatus?: boolean;
  notify?: boolean;
  clean?: boolean;
}

const uiRepo = 'xinshangshangxin/snet-x';
class Snet extends Core {
  private actionDeferred: Deferred<any> = defer();

  constructor(public tray = new SnetTray(), public snetXRelease = new GithubRelease(uiRepo)) {
    super();
    this.actionDeferred.resolve();
  }

  public async startup() {
    return this.lockAction('startup', async () => {
      return this.tryStartup();
    });
  }

  public async start(config?: StartConfig, isCheckLock?: boolean) {
    return this.lockAction(
      'start',
      async () => {
        return this.tryStart(config);
      },
      isCheckLock
    );
  }

  public async stop(config?: StopConfig, isCheckLock?: boolean) {
    return this.lockAction(
      'stop',
      async () => {
        return this.tryStop(config);
      },
      isCheckLock
    );
  }

  private async lockAction<T>(key: string, cb: () => Promise<T>, isCheckLock = true) {
    const uid = v4();
    if (!isCheckLock) {
      console.debug(`[${key}] skip check lock [${uid}]`);

      return cb();
    }

    console.debug(`[${key}] wait latest locking.... [${uid}]`);
    // 等待上次解锁
    await this.actionDeferred.promise;

    console.debug(`[${key}] relocking.... [${uid}]`);
    // 重新 上锁
    this.actionDeferred = defer();

    try {
      console.debug(`[${key}] call real function [${uid}]`);
      const data = await cb();

      console.debug(`[${key}] unlocking... [${uid}]`);
      // 解锁
      this.actionDeferred.resolve(data);

      return data;
    } catch (e) {
      // 解锁
      console.debug(`[${key}] unlocking... [${uid}]`);

      this.actionDeferred.resolve();
      throw e;
    }
  }

  private async tryStartup() {
    console.info('startup...');

    console.debug('创建 snet 日志文件');
    await ensureFile(snetLogPath);

    console.debug('第一次启动, 先尝试停止上一次可能的残留');
    await this.tryStop({ persistStatus: false });

    const status = await getStatus();

    console.debug('启动检查上次是否在运行状态', { status });
    if (status?.running) {
      await this.tryStart();
    }

    console.info('startup done');
  }

  private async tryStart({ configId, notify = false }: StartConfig = {}) {
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

    await this.tryStop({ persistStatus: false, notify, clean: true });

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

    await Snet.cleanDns();
  }

  private async tryStop({ persistStatus = true, notify = false, clean = false }: StopConfig = {}) {
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

    if (clean) {
      console.debug('cleanPf');
      // 清除本地 DNS
      await Snet.cleanDns();
      // 清除 pf 规则
      await Snet.cleanPF();
    }

    if (persistStatus) {
      console.debug('save status stopped');
      await saveStatus({ running: false });
    }

    if (notify) {
      notifyStopped();
    }
  }

  public async canUpdate() {
    const [core, ui] = await Promise.all([this.coreCanUpdate(), this.uiCanUpdate()]);

    return {
      core,
      ui,
    };
  }

  private async uiCanUpdate() {
    const release = await this.snetXRelease.getLatestRelease(/\.dmg/i);
    const latestVersion = release.version;
    const { ui } = this.version;

    return {
      version: ui,
      latest: latestVersion,
      update: ui !== latestVersion,
      release,
    };
  }

  private static async cleanDns() {
    // 清除本地 DNS
    await sudoRun.runAsync('dscacheutil -flushcache');
    await sudoRun.runAsync('killall -HUP mDNSResponder');
  }

  private static async cleanPF() {
    await sudoRun.runAsync('pfctl -d', { stdio: 'pipe' });
  }
}

export { Snet };
