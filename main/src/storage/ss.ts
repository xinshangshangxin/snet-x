import { creatOrUpdate, SSConfigModel } from './db';
import { SSConfig } from './interface';

async function get(_id?: string) {
  let query: any = {};

  if (_id) {
    query._id = _id;
  } else {
    query = {
      isDefault: true,
    };
  }

  return SSConfigModel.findOne(query);
}

async function list(query: { [key: string]: any } = {}) {
  return SSConfigModel.find(query);
}

async function save(doc: Partial<SSConfig>) {
  return creatOrUpdate(SSConfigModel, doc);
}

async function remove(_id: string) {
  return SSConfigModel.deleteOne({ _id });
}

export { get as getSS, list as listSS, save as saveSS, remove as removeSS };
