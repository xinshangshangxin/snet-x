import { app } from 'electron';
import { isNaN, toPairs } from 'lodash';
import { throttleTime } from 'rxjs/operators';

import { Subscription } from 'rxjs';
import { getScreenQRCode } from '../qrcode';
import { speed } from '../shared/net-tools/speed-test';
import { Errors } from '../shared/project/error';
import { exec } from '../shared/shell/exec';
import { sudoRun } from '../shared/shell/sudo-run';
import { getSchema, getStepperSchema } from '../snet/config/all.schema';
import {
  getSnetConfig,
  getStatus,
  listSnetConfig,
  removeSnetConfig,
  saveSnetConfig,
  saveStatus,
  updateSnetConfigSort,
} from '../storage';
import { dbDir, logsDir } from '../storage/store-path';
import { netCheck } from '../utils/net-check';
import { checkPermissionIsInvalid } from './check-permission';
import { instance } from './instance';

interface RouterMap {
  [key: string]: (...args: any[]) => Promise<any> | any;
}

async function checkSudo(rerun = true) {
  const e = await checkPermissionIsInvalid();

  if (e) {
    throw e;
  }

  const { snet } = instance;
  console.info('snet.isRunning: ', snet.isRunning);
  if (rerun && !snet.isRunning) {
    await snet.startup();
  }
}

let speedTestSubscription: Subscription | undefined;

const routers: RouterMap = {
  'config:schema': () => {
    return getSchema();
  },
  'config:stepper-schema': () => {
    return getStepperSchema();
  },
  'config:save': async (body: any) => {
    const inputId = body._id;
    await saveSnetConfig(body);

    const { snet } = instance;

    // 新增或者名称修改才需要, 这边直接对所有情况都更新
    await snet.tray.rebuildMenu();

    const invalid = await checkPermissionIsInvalid();
    if (!invalid) {
      const status = await getStatus();

      if (status && status.configId === inputId && snet.isRunning) {
        await snet.stop({ notify: false });
        await snet.start({ notify: false, configId: inputId });
      }
    }
  },
  'config:query': listSnetConfig,
  'config:get': getSnetConfig,
  'config:remove': async (body: string) => {
    if (!body) {
      return;
    }
    await removeSnetConfig(body);
    await instance.snet?.tray.rebuildMenu();
  },
  'config:order': async (body: { _id: string; order: number }[]) => {
    await updateSnetConfigSort(body);

    const { snet } = instance;
    await snet.tray.rebuildMenu();
  },
  'password:set': async (body: string) => {
    if (instance.snet.isRunning) {
      await instance.snet.stop();
    }

    // eslint-disable-next-line no-param-reassign
    sudoRun.password = body;
    return checkSudo();
  },
  'password:check': () => {
    return checkSudo(false);
  },
  'ip:check': (body: number) => {
    const nu = parseInt(`${body}`, 10);
    return netCheck.checkIp(isNaN(nu) ? undefined : nu);
  },
  'domain:check': (body: string) => {
    const input = netCheck.pickDomainOrIp(body);
    if (!input) {
      throw new Errors.DomainCheckFailed({ msg: 'no valid domain or ip' });
    }

    return netCheck.checkIsFQ(body, input);
  },
  'log:open': () => {
    return exec(`open "${logsDir}"`);
  },
  'db:open': () => {
    return exec(`open "${dbDir}"`);
  },
  'snet:start': async () => {
    await instance.snet.startup();
    await instance.snet.start({ notify: true });
  },
  'snet:inited': async () => {
    await saveStatus({ inited: true });
  },
  'snet:clear': async () => {
    const { snet } = instance;
    await snet?.stop({ notify: true, cleanPf: true });
  },
  'snet:version': async () => {
    const { snet } = instance;
    return snet?.version;
  },
  'snet:can-update': async () => {
    const { snet } = instance;

    return snet?.canUpdate();
  },
  'snet-core:list': async () => {
    const { snet } = instance;
    return snet?.list();
  },
  'snet-core:update': async ({ notifyId, checkIsFQ } = {}) => {
    const { router, snet } = instance;

    if (checkIsFQ) {
      if (!snet.isRunning) {
        throw new Errors.NetworkNotFQ();
      }
    }

    const download$ = await snet.download();
    download$.pipe(throttleTime(1000, undefined, { trailing: true })).subscribe(
      (value) => {
        console.info(notifyId, value);
        router?.post(notifyId, value, 'ignore');
      },
      (e) => {
        console.warn(e);
        router?.post(
          notifyId,
          new Errors.DownloadFailed({ message: e.message }).toJSON(),
          'ignore'
        );
      }
    );
  },
  'snet-core:set-version': async ({ bin, version } = {}) => {
    await saveStatus({ snetPath: bin, snetVersion: version });

    const { snet } = instance;
    await snet.checkPath();
  },
  'speed-test:start': async ({ notifyId } = {}) => {
    const { router } = instance;
    const speedTest$ = speed();

    speedTestSubscription = speedTest$.subscribe(
      (value) => {
        router?.post(notifyId, value, 'ignore', false);
      },
      (e) => {
        console.warn(e);
        router?.post(
          notifyId,
          new Errors.SpeedTestFailed({ msg: e.message, stack: e.stack }).toJSON(),
          'ignore'
        );
      }
    );
  },
  'speed-test:cancel': async () => {
    speedTestSubscription?.unsubscribe();
  },
  'qrcode:scan': async () => {
    const { win } = instance;
    const url = await getScreenQRCode(win);
    return url;
  },
  'exit:all': () => {
    app.quit();
  },
};

function register() {
  const { router } = instance;

  toPairs(routers).forEach(([key, fun]) => {
    router?.register(key, (...args: any[]) => {
      return fun(...args);
    });
  });
}

export { register };
