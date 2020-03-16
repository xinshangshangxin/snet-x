import { access, createWriteStream, ensureDir, move, remove, writeFile } from 'fs-extra';
import got from 'got';
import { resolve } from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

export class GithubRelease {
  constructor(private repo: string) {}

  public async download(
    outDir: string,
    outName: string = this.repo.replace(/.*\//, ''),
    outVersionName = 'version.txt'
  ) {
    console.info('download');

    await ensureDir(outDir);
    const outputPath = resolve(outDir, outName);
    const outputTempPath = resolve(outDir, `${outName}.tmp`);

    try {
      await access(outputPath);
      return outputPath;
    } catch (_) {} // eslint-disable-line no-empty

    await remove(outputTempPath);

    const { cnDownloadUrl, version, downloadUrl } = await this.getLatestAsset();

    console.info('getLatestAsset', { cnDownloadUrl, version, downloadUrl });
    await writeFile(resolve(outDir, outVersionName), version);

    await pipelineAsync(got.stream(cnDownloadUrl), createWriteStream(outputTempPath));

    await move(outputTempPath, outputPath);

    return outputPath;
  }

  private cnUrl({ name, version }: { name: string; version: string }) {
    return `http://static.xinshangshangxin.com/github/${this.repo}/releases/download/${version}/${name}`;
  }

  private async getLatestAsset() {
    const url = `https://api.github.com/repos/${this.repo}/releases/latest`;

    const { tag_name: version, assets } = await got(url).json();

    const asset = assets.find((item: any) => {
      return item && /darwin/i.test(item.name);
    });

    if (!asset || !asset.browser_download_url) {
      throw new Error('no asset found');
    }

    return {
      version,
      downloadUrl: asset.browser_download_url,
      cnDownloadUrl: this.cnUrl({ name: asset.name, version }),
      name: asset.name,
    };
  }
}
