import { from, of } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';

import { ClickData, ConfigClickData, ProxyModeClickData } from '../snet/tray';
import { saveStatus } from '../storage';
import { dealPermission } from './deal-permission';
import { instance } from './instance';
import { showWindow } from './show-window';
import { startWithCheckConfig } from './start-snet';

async function resolveClick({
  id,
  config,
  menuItem,
  proxyMode,
}: ClickData | ConfigClickData | ProxyModeClickData) {
  console.debug('menu click', { id, configId: config?._id, proxyMode });
  switch (id) {
    case 'start':
      await startWithCheckConfig();
      break;
    case 'stop':
      return instance.snet.stop({ persistStatus: true, notify: true });
    case 'permission':
      return dealPermission();
    case 'ip':
    case 'domain':
    case 'setting':
      instance.redirectSubject.next(id);
      return showWindow();
    default:
      break;
  }

  if (proxyMode) {
    await saveStatus({ proxyMode: id as any });
    // eslint-disable-next-line no-param-reassign
    menuItem.checked = true;

    // 切换配置
    await instance.snet.stop({ persistStatus: false, notify: false, clean: true });
    await instance.snet.start({ notify: false });
    return null;
  }

  if (!config) {
    return null;
  }

  // 切换配置
  await instance.snet.stop({ persistStatus: false, notify: false, clean: true });
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
