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
  const arr = await SnetConfigModel.find(query, { sort: { order: 1 } });

  return Promise.all(
    arr.map((item) => {
      return rebuildConfig(item);
    })
  );
}

async function save(doc: Partial<SnetConfig>) {
  if (!doc._id) {
    const item = await SnetConfigModel.findOne({}, { sort: { order: -1 } });
    // eslint-disable-next-line no-param-reassign
    doc.order = ((item && item.order) || 999) + 1;
  }
  return creatOrUpdate(SnetConfigModel, string2int(doc));
}

async function remove(_id: string) {
  return SnetConfigModel.deleteOne({ _id });
}

async function updateSort(arr: { _id: string; order: number }[]) {
  await Promise.all(
    arr.map(({ _id, order }) => {
      return SnetConfigModel.updateOne({ _id }, { $set: { order } });
    })
  );
}

export {
  get as getSnetConfig,
  list as listSnetConfig,
  save as saveSnetConfig,
  remove as removeSnetConfig,
  updateSort as updateSnetConfigSort,
};
