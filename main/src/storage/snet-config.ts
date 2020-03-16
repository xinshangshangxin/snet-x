import { getBlacklist } from './blacklist';
import { creatOrUpdate, SnetConfigModel, string2int } from './db';
import { getDNS } from './dns';
import { SnetConfig } from './interface';
import { getSS } from './ss';

async function rebuildConfig(
  doc: SnetConfig & { ssId?: string; DNSId?: string; blacklistId?: string }
) {
  let ssConfig: any;
  let dnsConfig: any;
  let blacklistConfig: any;

  if (doc.ssId) {
    ssConfig = await getSS(doc.ssId);
  }

  if (doc.DNSId) {
    dnsConfig = await getDNS(doc.DNSId);
  }

  if (doc.blacklistId) {
    blacklistConfig = await getBlacklist(doc.blacklistId);
  }

  return {
    ...doc,
    ssConfig,
    dnsConfig,
    blacklistConfig,
  };
}

async function get(_id: string) {
  const config = await SnetConfigModel.findOne({ _id });
  if (!config) {
    return null;
  }
  return rebuildConfig(config);
}

async function list(query: { [key: string]: any } = {}) {
  const arr = await SnetConfigModel.find(query);

  return Promise.all(
    arr.map((item) => {
      return rebuildConfig(item);
    })
  );
}

async function save(doc: Partial<SnetConfig>) {
  return creatOrUpdate(SnetConfigModel, string2int(doc));
}

async function remove(_id: string) {
  return SnetConfigModel.deleteOne({ _id });
}

export {
  get as getSnetConfig,
  list as listSnetConfig,
  save as saveSnetConfig,
  remove as removeSnetConfig,
};
