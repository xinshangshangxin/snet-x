import { sudoRun } from '../shared/shell/sudo-run';
import { instance } from './instance';

async function checkPermissionIsInvalid() {
  const { snet } = instance;
  try {
    // 检查是否有 sudo 权限
    await sudoRun.checkSudo();

    // 检查 snet 程序
    await snet.checkPath();

    // tray 设置
    snet.tray.changePermission(true);
    return false;
  } catch (e) {
    snet.tray.changePermission(false);

    return e;
  }
}

export { checkPermissionIsInvalid };
