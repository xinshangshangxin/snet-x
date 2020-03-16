import { creatOrUpdate, DNSConfigModel } from './db';
import { DNSConfig } from './interface';

async function get(_id?: string) {
  let query: any = {};

  if (_id) {
    query._id = _id;
  } else {
    query = {
      isDefault: true,
    };
  }

  return DNSConfigModel.findOne(query);
}

async function list(query: { [key: string]: any } = {}) {
  return DNSConfigModel.find(query);
}

async function save(doc: Partial<DNSConfig>) {
  return creatOrUpdate(DNSConfigModel, doc);
}

async function remove(_id: string) {
  return DNSConfigModel.deleteOne({ _id });
}

export { get as getDNS, list as listDNS, save as saveDNS, remove as removeDNS };
