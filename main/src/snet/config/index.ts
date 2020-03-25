import { getSnetConfig, getStatus, listSnetConfig } from '../../storage';
import { SnetConfig } from '../../storage/interface';

async function getConfig(configId?: string): Promise<SnetConfig | null> {
  const status = await getStatus();
  const id = configId || status.configId;

  let config: SnetConfig | null = null;

  if (id) {
    console.debug('get configId: ', id);
    try {
      config = await getSnetConfig(id);
    } catch (e) {
      console.warn(e);
    }
  }

  if (!config) {
    const arr = await listSnetConfig();

    console.debug('list config: ', arr);
    [config] = arr;
  }

  switch (status.proxyMode) {
    case 'global':
      return {
        ...config,
        'proxy-scope': 'global',
      };

    case 'bypassCN':
      return {
        ...config,
        'proxy-scope': 'bypassCN',
      };

    default:
      return config;
  }
}

export { getConfig };
