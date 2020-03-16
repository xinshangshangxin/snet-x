import { from, of } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';

import { exec } from '../shared/shell/exec';
import { ClickData, ConfigClickData } from '../snet/tray';
import { logsDir } from '../storage/store-path';
import { netCheck } from '../utils/net-check';
import { dealPermission } from './deal-permission';
import { instance } from './instance';
import { showWindow } from './show-window';
import { startWithCheckConfig } from './start-snet';

async function resolveClick({ id, config, menuItem }: ClickData | ConfigClickData) {
  console.debug('menu click', { id, configId: config?._id });
  switch (id) {
    case 'start':
      await startWithCheckConfig();
      break;
    case 'stop':
      return instance.snet.stop({ persistStatus: true, notify: true });
    case 'log':
      return exec(`open "${logsDir}"`);
    case 'permission':
      console.warn('permission');
      return dealPermission();
    case 'ip':
      return netCheck.notifyIp();
    case 'setting':
      instance.redirectSubject.next('setting');
      return showWindow();
    default:
      break;
  }

  if (!config) {
    return null;
  }

  // 切换配置
  await instance.snet.stop({ persistStatus: false, notify: false, cleanPf: true });
  await instance.snet.start({ configId: config._id, notify: true });

  // eslint-disable-next-line no-param-reassign
  menuItem.checked = true;

  return null;
}

function addTray() {
  instance.snet.tray.menuClickSubject
    .pipe(
      filter(({ id }) => {
        return !!id;
      }),
      switchMap((data) => {
        return from(resolveClick(data)).pipe(
          catchError((err) => {
            console.warn('tray run error', err);

            return of('got error');
          })
        );
      })
    )
    .subscribe(
      () => {},
      (e) => {
        console.warn(e);
        throw new Error('menu click failed, should not in here');
      },
      () => {
        console.warn('menu click complete, should not in here');
      }
    );
}

export { addTray };
