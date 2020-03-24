import { access } from 'fs-extra';

async function exists(filePath?: string) {
  if (!filePath) {
    return false;
  }

  try {
    await access(filePath);
    return true;
  } catch (_) {
    return false;
  }
}

export { exists };
