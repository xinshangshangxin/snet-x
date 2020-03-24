import BB from 'bluebird';
import { createWriteStream, ensureDir, move, readdir, remove } from 'fs-extra';
import got from 'got';
import { ProxyStream } from 'got/dist/source/as-stream';
import { resolve } from 'path';
import { Observable } from 'rxjs';
import { pipeline } from 'stream';
import { promisify } from 'util';

import { snetDir } from '../storage/store-path';
import { exists } from '../utils/exists';
import { Errors } from './project/error';

const pipelineAsync = promisify(pipeline);

export interface ReleaseInfo {
  version: string;
  downloadUrl: string;
  name: string;
}

interface DownloadProgress {
  type: 'progress';
  percent: number;
  transferred: number;
  total: number;
}

interface DownloadComplete {
  type: 'complete';
  bin: string;
  version: string;
}

export class GithubRelease {
  private releaseInfoUrl: string;

  private binName: string;

  constructor(private repo: string) {
    this.releaseInfoUrl = `https://api.github.com/repos/${this.repo}/releases/latest`;
    this.binName = this.repo.replace(/.*\//, '');
  }

  public async getLatestVersion() {
    const { version } = await this.getLatestRelease();
    return version;
  }

  public async getLatestRelease(): Promise<ReleaseInfo> {
    console.debug('getLatestAsset');
    const { tag_name: version, assets } = await got(this.releaseInfoUrl).json();

    const asset = assets.find((item: any) => {
      return item && /darwin/i.test(item.name);
    });

    if (!asset || !asset.browser_download_url) {
      throw new Errors.NoGithubReleaseFound({
        repo: this.repo,
        assets,
        version,
        releaseInfoUrl: this.releaseInfoUrl,
      });
    }

    return {
      version,
      downloadUrl: asset.browser_download_url,
      name: asset.name,
    };
  }

  public async list() {
    const list = await readdir(snetDir);

    return BB.map(list, (v) => {
      return this.paths(v);
    }).filter(({ bin }) => {
      return exists(bin);
    });
  }

  public async download(isProgress: false): Promise<DownloadComplete>;

  public async download(isProgress: true): Promise<Observable<DownloadComplete | DownloadProgress>>;

  public async download(isProgress = false) {
    const release = await this.getLatestRelease();
    console.debug('release: ', release);

    if (isProgress) {
      return this.downloadToVersionDirWithProgress(release);
    }

    return this.downloadToVersionDir(release);
  }

  public downloadToVersionDirWithProgress({
    version,
    downloadUrl,
  }: ReleaseInfo): Observable<DownloadComplete | DownloadProgress> {
    let stream: ProxyStream<any> | undefined;

    return new Observable<DownloadProgress | DownloadComplete>((observer) => {
      (async () => {
        const { dir, bin } = this.paths(version);

        // check latest version is downloaded
        const isDownloaded = await exists(bin);
        if (isDownloaded) {
          observer.next({ bin, version, type: 'complete' });
          observer.complete();
          return;
        }

        await ensureDir(dir);

        const outputTempPath = resolve(dir, `${this.binName}.tmp`);
        await remove(outputTempPath);

        stream = got.stream(downloadUrl, {
          timeout: {
            lookup: 3 * 1000,
            connect: 3 * 1000,
            send: 10 * 1000,
            request: 30 * 1000,
          },
        });

        stream.on('downloadProgress', (progress: Omit<DownloadProgress, 'type'>) => {
          console.debug('progress: ', progress);
          observer.next({
            type: 'progress',
            ...progress,
          });
        });

        stream.on('error', (e) => {
          console.warn(e);
          observer.error(e);
        });

        // download to version dir
        await pipelineAsync(stream, createWriteStream(outputTempPath));
        await move(outputTempPath, bin);

        observer.next({ bin, version, type: 'complete' });
        observer.complete();
      })().catch((e) => {
        console.warn(e);
        observer.error(e);
      });

      return () => {
        stream?.destroy();
      };
    });
  }

  private async downloadToVersionDir({ version, downloadUrl }: ReleaseInfo) {
    const { dir, bin } = this.paths(version);

    // check latest version is downloaded
    const isDownloaded = await exists(bin);
    if (isDownloaded) {
      return { bin, version };
    }

    await ensureDir(dir);

    const outputTempPath = resolve(dir, `${this.binName}.tmp`);
    await remove(outputTempPath);

    // download to version dir
    await pipelineAsync(got.stream(downloadUrl), createWriteStream(outputTempPath));
    await move(outputTempPath, bin);

    return { bin, version };
  }

  private paths(version: string) {
    const outVersionDir = resolve(snetDir, version);
    const outputPath = resolve(outVersionDir, this.binName);

    return {
      version,
      dir: outVersionDir,
      bin: outputPath,
    };
  }
}
