import { IModel, Nmdb, Schema } from '@s4p/nmdb';
import { fromPairs, has, isNumber, isString, toPairs, omit } from 'lodash';

import { Errors } from '../shared/project/error';
import { BlacklistConfig, DNSConfig, SnetConfig, SSConfig, Status } from './interface';
import { dbDir } from './store-path';

const nmdb = new Nmdb(`nedb://${dbDir}`);

function toUnRequired(schema: { [key: string]: any }) {
  return fromPairs(
    toPairs(schema).map(([key, value]) => {
      return [key, { ...value, required: false }];
    })
  );
}

const StatusModel = nmdb.model<Status>('Status', {
  _id: {
    type: 'string',
  },
  inited: {
    type: 'boolean',
    default: false,
  },
  configId: {
    type: 'string',
  },
  snetPath: {
    type: 'string',
  },
  snetVersion: {
    type: 'string',
  },
  proxyMode: {
    type: 'string',
  },
  running: {
    type: 'boolean',
  },
  sudoPassword: {
    type: 'string',
  },
});

const SSConfigSchema = {
  _id: {
    type: 'string',
  },
  isDefault: {
    type: 'boolean',
    default: false,
  },
  name: {
    type: 'string',
    required: true,
  },
  'proxy-type': {
    type: 'string',
    required: true,
  },
  'proxy-scope': {
    type: 'string',
    required: true,
  },
  'proxy-timeout': {
    type: 'number',
    required: true,
  },

  'ss-host': {
    type: 'string',
  },
  'ss-port': {
    type: 'number',
  },
  'ss-chpier-method': {
    type: 'string',
  },
  'ss-passwd': {
    type: 'string',
  },
};
const SSConfigModel = nmdb.model<SSConfig>('SSConfig', SSConfigSchema);

const DNSConfigSchema = {
  _id: {
    type: 'string',
  },
  isDefault: {
    type: 'boolean',
    default: false,
  },
  name: {
    type: 'string',
    required: true,
  },
  'cn-dns': {
    type: 'string',
    required: true,
  },
  'fq-dns': {
    type: 'string',
    required: true,
  },
  'enable-dns-cache': {
    type: 'boolean',
    required: true,
  },
  'enforce-ttl': {
    type: 'number',
    required: true,
  },
  'disable-qtypes': {
    type: Schema.Types.Mixed,
    required: true,
  },
  'dns-prefetch-enable': {
    type: 'boolean',
    required: true,
  },
  'dns-prefetch-count': {
    type: 'number',
    required: true,
  },
  'dns-prefetch-interval': {
    type: 'number',
    required: true,
  },
};
const DNSConfigModel = nmdb.model<DNSConfig>('DNSConfig', DNSConfigSchema);

const BlacklistConfigSchema = {
  _id: {
    type: 'string',
  },
  isDefault: {
    type: 'boolean',
    default: false,
  },
  name: {
    type: 'string',
    required: true,
  },
  'force-fq': {
    type: Schema.Types.Mixed,
    required: true,
  },
  'block-host-file': {
    type: 'string',
    required: true,
  },
  'block-hosts': {
    type: Schema.Types.Mixed,
    required: true,
    default: [],
  },
  'bypass-hosts': {
    type: Schema.Types.Mixed,
    required: true,
    default: [],
  },
  'host-map': {
    type: Schema.Types.Mixed,
    required: true,
    default: {},
  },
};
const BlacklistConfigModel = nmdb.model<BlacklistConfig>('BlacklistConfig', BlacklistConfigSchema);

const SnetConfigModel = nmdb.model<SnetConfig>('SnetConfig', {
  ssId: {
    type: 'string',
  },
  ...toUnRequired(SSConfigSchema),

  DNSId: {
    type: 'string',
  },
  ...toUnRequired(DNSConfigSchema),

  blacklistId: {
    type: 'string',
  },
  ...toUnRequired(BlacklistConfigSchema),

  _id: {
    type: 'string',
  },
  name: {
    type: 'string',
    required: true,
  },
  'listen-host': {
    type: 'string',
    required: true,
  },
  'listen-port': {
    type: 'number',
    required: true,
  },

  order: {
    type: 'number',
    required: true,
  },
});

function creatOrUpdate<T>(Model: IModel<T>, doc: any) {
  if (!doc) {
    throw new Errors.DocTypeError({ message: 'creatOrUpdate no doc found' });
  }

  if (!doc._id) {
    return Model.insertOne(omit(doc, ['_id', 'createdAt', 'updatedAt']));
  }
  return Model.updateOne({ _id: doc._id }, { $set: doc });
}

function string2int(doc: any) {
  const keys = [
    'listen-port',
    'proxy-timeout',
    'ss-port',
    'enforce-ttl',
    'dns-prefetch-count',
    'dns-prefetch-interval',
  ];

  keys.forEach((key) => {
    if (!has(doc, key)) {
      return;
    }

    const v = doc[key];

    if (isNumber(v)) {
      return;
    }

    if (isString(v) && /^\d+$/.test(v)) {
      // eslint-disable-next-line no-param-reassign
      doc[key] = parseInt(v, 10);
      return;
    }

    throw new Errors.DocTypeError({ key, doc });
  });

  return doc;
}

export {
  StatusModel,
  SSConfigModel,
  DNSConfigModel,
  BlacklistConfigModel,
  SnetConfigModel,
  creatOrUpdate,
  string2int,
};
