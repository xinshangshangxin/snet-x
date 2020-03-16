import { fromPairs, toPairs } from 'lodash';

import { blacklistSchema } from '../snet/config/blacklist.schema';
import { DNSSchema } from '../snet/config/dns.schema';
import { getBlacklist, saveBlacklist } from './blacklist';
import { getDNS, saveDNS } from './dns';

async function initDatabase() {
  const [dns, blacklist] = await Promise.all([getDNS(), getBlacklist()]);

  if (!dns) {
    await saveDNS({
      isDefault: true,
      name: '默认DNS',
      ...fromPairs(
        toPairs(DNSSchema.items).map(([key, { default: defaultValue }]) => {
          return [key, defaultValue];
        })
      ),
    });
  }

  if (!blacklist) {
    await saveBlacklist({
      isDefault: true,
      name: '默认黑白名单',
      ...fromPairs(
        toPairs(blacklistSchema.items).map(([key, { default: defaultValue }]) => {
          return [key, defaultValue];
        })
      ),
    });
  }
}

export { initDatabase };
