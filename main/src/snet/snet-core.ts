import childProcess from 'child_process';
import { resolve } from 'path';

import version from '../../assets/version.json';
import { GithubRelease, ReleaseInfo } from '../shared/github-release';
import { Errors } from '../shared/project/error';
import { getStatus, saveStatus } from '../storage';
import { exists } from '../utils/exists';

interface UpdateStatus {
  version: string;
  latest: string;
  update: boolean;
  release: ReleaseInfo;
}

const snetRepo = 'monsterxx03/snet';

class Core {
  private defaultSnetPath = resolve(__dirname, '../../assets/snet');

  protected child: childProcess.ChildProcess | null = null;

  protected snetPath = this.defaultSnetPath;

  protected snetVersion = version.core;

  constructor(public snetRelease = new GithubRelease(snetRepo)) {}

  public get isRunning() {
    return !!this.child;
  }

  public get version() {
    return {
      core: this.snetVersion,
      defaultCore: version.core,
      ui: `v${version.ui}`,
    };
  }

  public async checkPath(): Promise<string> {
    const { snetPath, snetVersion } = await getStatus();
    this.snetPath = snetPath || '';
    this.snetVersion = snetVersion || '';

    const isExists = await exists(this.snetPath);

    // 用户设置, 或者下载的 snet 被删除了
    if (!isExists) {
      // 内置的 snet 也被删除了
      if (this.snetPath === this.defaultSnetPath) {
        throw new Errors.NoSnetPath({
          snetPath: this.snetPath,
          defaultSnetPath: this.defaultSnetPath,
        });
      }

      // 使用内置snet
      await this.setVersion(this.defaultSnetPath, version.core);
      return this.checkPath();
    }

    console.debug('use snet: ', this.snetPath);
    return this.snetPath;
  }

  public async download(release?: ReleaseInfo) {
    let progress;
    if (!release) {
      progress = await this.snetRelease.download(true);
    } else {
      progress = this.snetRelease.downloadToVersionDirWithProgress(release);
    }

    return progress;
  }

  public async resetVersion() {
    await this.setVersion(this.defaultSnetPath, version.core);
  }

  public async setVersion(snetPath: string, snetVersion: string) {
    const isExists = await exists(snetPath);

    if (!isExists) {
      throw new Errors.NoSnetFound({ snetPath });
    }

    await saveStatus({ snetPath, snetVersion });
    this.snetPath = snetPath;
    this.snetVersion = snetVersion;
  }

  // eslint-disable-next-line class-methods-use-this
  public async list() {
    const arr = await this.snetRelease.list();

    return [
      {
        version: version.core,
        dir: undefined,
        bin: this.defaultSnetPath,
      },
      ...arr,
    ];
  }

  protected async coreCanUpdate(): Promise<UpdateStatus> {
    const release = await this.snetRelease.getLatestRelease();
    const latestVersion = release.version;
    const { snetVersion } = await getStatus();

    // 自带版本
    if (!snetVersion) {
      return {
        version: version.core,
        latest: latestVersion,
        update: version.core !== latestVersion,
        release,
      };
    }

    // 用户外置路径
    if (snetVersion === 'custom') {
      return {
        version: 'custom',
        latest: latestVersion,
        update: false,
        release,
      };
    }

    // 内置下载器下载版本
    return {
      version: snetVersion,
      latest: latestVersion,
      update: snetVersion !== latestVersion,
      release,
    };
  }
}

export { Core };
