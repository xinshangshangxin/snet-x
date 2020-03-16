import { remove } from 'fs-extra';
import { read } from 'jimp';
import jsQR from 'jsqr';
import { parentPort, workerData } from 'worker_threads';

async function decode({ imagePath, clean = true }: { imagePath: string; clean?: boolean }) {
  const image = await read(imagePath);

  if (clean) {
    await remove(imagePath);
  }

  // TODO: 待调整, 目前在本地上工作良好
  const width = 800;
  const height = (image.bitmap.height * 800) / image.bitmap.width;
  const decodeImage = image.greyscale().resize(width, height);

  return jsQR(
    new Uint8ClampedArray(decodeImage.bitmap.data.buffer),
    decodeImage.bitmap.width,
    decodeImage.bitmap.height,
    { inversionAttempts: 'dontInvert' }
  );
}

(async () => {
  const data = await decode(workerData);
  parentPort?.postMessage(data?.data);
})();
