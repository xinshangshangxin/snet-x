import { getSnetConfig, getStatus, listSnetConfig } from '../../storage';
import { SnetConfig } from '../../storage/interface';

async function getConfig(configId?: string): Promise<SnetConfig | null> {
  let id = configId;
  console.debug('input configId:', configId);
  if (!configId) {
    id = (await getStatus())?.configId;

    console.debug('status configId', id);
  }

  if (id) {
    console.debug('get configId: ', id);
    try {
      return getSnetConfig(id);
    } catch (e) {
      console.warn(e);
    }
  }

  const arr = await listSnetConfig();

  console.debug('list config: ', arr);
  return arr[0];
}

export { getConfig };
