import { Notification } from 'electron';

import { SnetConfig } from '../storage/interface';

function notifyRunning(config: SnetConfig) {
  const n = new Notification({
    title: 'SnetX启动',
    subtitle: `配置: ${config.name || config._id}`,
    body: '',
  });

  n.show();

  console.debug('notifyRunning');
}

function notifyStopped(subtitle?: string, body = '') {
  const n = new Notification({
    title: 'SnetX 已停止',
    subtitle,
    body,
  });

  n.show();

  console.debug('notifyStopped');
}

function notifyIpResult(body: string) {
  const n = new Notification({
    title: 'SnetX IP',
    body,
  });

  n.show();

  console.debug('notifyIpResult');
}

export { notifyRunning, notifyStopped, notifyIpResult };
