import { OperationalError } from '../shared/project/error';
import { instance } from './instance';
import { showWindow } from './show-window';

async function startWithCheckConfig() {
  try {
    await instance.snet.start({ notify: true });
  } catch (e) {
    console.warn(e);

    if (e instanceof OperationalError && e.code === 'NoSnetConfigFound') {
      instance.redirectSubject.next('ss-config');
      showWindow();
    }
  }
}

export { startWithCheckConfig };
