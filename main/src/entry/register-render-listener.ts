import { isNaN, toPairs } from 'lodash';

import { getScreenQRCode } from '../qrcode/index';
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
} from '../storage';
import { logsDir } from '../storage/store-path';
import { NetCheck, netCheck } from '../utils/net-check';
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

    const invalid = await checkPermissionIsInvalid();
    if (!invalid) {
      const status = await getStatus();

      if (status && status.configId === inputId && snet.isRunning) {
        await snet.stop({ notify: false });
        await snet.start({ notify: true, configId: inputId });
      }
    }
  },
  'config:query': listSnetConfig,
  'config:get': getSnetConfig,
  'config:remove': async (body: string) => {
    if (!body) {
      return null;
    }
    return removeSnetConfig(body);
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
    if (NetCheck.urlPickDomain.test(body)) {
      return netCheck.checkIsFQ(RegExp.$2);
    }

    throw new Errors.DomainCheckFailed({ msg: 'not valid domain' });
  },
  'log:open': () => {
    return exec(`open "${logsDir}"`);
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
  'qrcode:scan': async () => {
    const { win } = instance;
    const url = await getScreenQRCode(win);
    return url;
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
