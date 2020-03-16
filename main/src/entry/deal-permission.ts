import { Errors, OperationalError } from '../shared/project/error';
import { checkPermissionIsInvalid } from './check-permission';
import { instance } from './instance';
import { showWindow } from './show-window';

async function dealPermission(): Promise<false | OperationalError> {
  const { snet, redirectSubject } = instance;

  const e = await checkPermissionIsInvalid();

  if (e === false) {
    return false;
  }

  console.warn(e);
  snet.tray.setPermission(false);

  if (e instanceof Errors.NoSudoPermission) {
    console.info('need set sudo password');
    redirectSubject.next('password');
    showWindow();
  }
  if (e instanceof Errors.NoSnetFound || e instanceof Errors.NoSnetPath) {
    console.info('need set snet path');
    redirectSubject.next('snet');
    showWindow();
  }

  return e;
}

export { dealPermission };
