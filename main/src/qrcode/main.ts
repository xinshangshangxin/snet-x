import BB from 'bluebird';
import { BrowserWindow } from 'electron';
import { remove } from 'fs-extra';
import { tmpdir } from 'os';
import { resolve as pathResolve } from 'path';
import { v4 } from 'uuid';
import { Worker } from 'worker_threads';

import { Errors } from '../shared/project/error';
import { exec } from '../shared/shell/exec';

async function screen(): Promise<string> {
  const tempFile = pathResolve(tmpdir(), `${v4()}.jpg`);
  await exec(`screencapture -t jpg -T 0 -r -x ${tempFile}`);
  return tempFile;
}

async function getScreenQRCode(win?: BrowserWindow | null) {
  console.time('getScreenQRCode');

  console.time('screen');
  win?.hide();
  const imagePath = await screen();
  console.info('imagePath: ', imagePath);
  win?.show();
  console.timeEnd('screen');

  console.time('decode');
  const filename = pathResolve(__dirname, './decode.worker.js');

  const worker = new Worker(filename, {
    workerData: {
      imagePath,
    },
  });

  const url = await new BB<string>((resolve, reject) => {
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => {
      console.info('worker exit......');
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      } else {
        reject(new Error('worker no data return'));
      }
    });
  })
    .timeout(5000)
    .catch((e) => {
      remove(imagePath).catch(console.warn);

      console.warn(e);
      throw new Errors.QRCodeDecodeFailed({ message: e.message });
    });

  console.timeEnd('decode');
  console.timeEnd('getScreenQRCode');

  return url;
}

export { getScreenQRCode };
