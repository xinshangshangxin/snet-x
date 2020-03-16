import BB from 'bluebird';
import childProcess, { spawn } from 'child_process';
import { app } from 'electron';
import { deletePassword, getPassword, setPassword } from 'keytar';

import { isDev } from '../project/env';
import { Errors } from '../project/error';
import { exec } from './exec';
import { treeProcessIds } from './ps-tree';

export enum Signal {
  HUP = 1,
  INT = 2,
  QUIT = 3,
  KILL = 9,
  TERM = 15,
}

const storeService = `${app.name}${isDev ? '-dev' : ''}`;

export class SudoRun {
  private static passwordStorageKey = 'sudoPassword';

  private sudoPassword?: string;

  private setPasswordPromise: Promise<void> = Promise.resolve();

  constructor(inputPassword?: string) {
    if (inputPassword) {
      this.password = inputPassword;
    }
  }

  public set password(value: string) {
    const safePassword = SudoRun.safePassword(value);

    if (this.sudoPassword === safePassword) {
      return;
    }

    console.info(`set sudo password ${isDev ? safePassword : '******'}`);
    this.sudoPassword = safePassword;

    (async () => {
      if (!safePassword) {
        console.info('delete sudo password');
        await deletePassword(storeService, SudoRun.passwordStorageKey);
        return;
      }

      // 等待上次保存执行完成
      await this.setPasswordPromise;

      // 检查保存的密码和新设置密码是否相同
      const storagePassword = await getPassword(storeService, SudoRun.passwordStorageKey);
      if (storagePassword === safePassword) {
        return;
      }

      // 保存密码
      this.setPasswordPromise = setPassword(storeService, SudoRun.passwordStorageKey, safePassword);
    })().catch(console.warn);
  }

  public async checkSudo() {
    if (this.sudoPassword === undefined) {
      await this.loadPassword();
    }

    try {
      await exec(`sudo -K && echo "${this.sudoPassword || storeService}" | sudo -S -v`);
    } catch (e) {
      throw new Errors.NoSudoPermission();
    }
  }

  public run(
    shellCmd: string,
    options: Omit<childProcess.SpawnOptions, 'shell'> = { stdio: 'inherit' }
  ) {
    const child = spawn(`echo "${this.sudoPassword}" | sudo -S ${shellCmd}`, {
      ...options,
      shell: true,
    });

    return {
      child,
      kill: () => {
        return this.killTree(child.pid);
      },
    };
  }

  public async runAsync(
    shellCmd: string,
    options: Omit<childProcess.SpawnOptions, 'shell'> = { stdio: 'inherit' },
    timeout = 10000
  ) {
    const { child, kill } = this.run(shellCmd, options);

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += `${data}`;
    });

    child.stderr?.on('data', (data) => {
      stderr += `${data}`;
    });

    return new BB<{ stdout: string; stderr: string }>((resolve, reject) => {
      child.once('error', reject);
      child.once('close', () => {
        resolve({
          stdout,
          stderr,
        });
      });
    })
      .timeout(timeout)
      .catch(async (e) => {
        if (kill) {
          await kill();
        }

        throw e;
      });
  }

  public async kill(pid: string | number | (string | number)[], signal: Signal = Signal.INT) {
    let ids = '';
    if (typeof pid === 'object') {
      ids = pid.join(' ');
    } else {
      ids = `${pid}`;
    }

    if (!ids) {
      return null;
    }

    console.debug(`kill -${signal} ${ids}`);
    return this.runAsync(`kill -${signal} ${ids}`, { stdio: 'pipe' });
  }

  public async killTree(pidOrChildProcess: number | childProcess.ChildProcess) {
    let pid = 0;
    if (typeof pidOrChildProcess === 'number') {
      pid = pidOrChildProcess;
    } else {
      pid = pidOrChildProcess.pid;
    }

    if (!pid) {
      throw new Error(`no pid found: ${pidOrChildProcess}`);
    }

    const ids = await treeProcessIds(pid);

    if (!ids.length) {
      console.warn(`no treeId found for pid: ${pid}`);
      return null;
    }

    return this.kill(ids);
  }

  public static safePassword(pswd: string) {
    return pswd.replace(/\\/g, '\\\\').replace(/'/g, '\\x27');
  }

  private async loadPassword() {
    try {
      const p = await getPassword(storeService, SudoRun.passwordStorageKey);

      if (p) {
        this.password = p;
      }
    } catch (e) {
      console.warn(e);

      throw new Errors.KeychainFailed({ message: e.message });
    }
  }
}

export const sudoRun = new SudoRun();
