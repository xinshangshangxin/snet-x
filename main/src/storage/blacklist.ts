import { BlacklistConfigModel, creatOrUpdate } from './db';
import { BlacklistConfig } from './interface';

async function get(_id?: string) {
  let query: any = {};

  if (_id) {
    query._id = _id;
  } else {
    query = {
      isDefault: true,
    };
  }

  return BlacklistConfigModel.findOne(query);
}

async function list(query: { [key: string]: any } = {}) {
  return BlacklistConfigModel.find(query);
}

async function save(doc: Partial<BlacklistConfig>) {
  return creatOrUpdate(BlacklistConfigModel, doc);
}

async function remove(_id: string) {
  return BlacklistConfigModel.deleteOne({ _id });
}

export {
  get as getBlacklist,
  list as listBlacklist,
  save as saveBlacklist,
  remove as removeBlacklist,
};
