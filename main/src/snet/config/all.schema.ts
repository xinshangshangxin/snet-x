import dayjs from 'dayjs';
import { cloneDeep, set } from 'lodash';

import { blacklistSchema } from './blacklist.schema';
import { DNSSchema } from './dns.schema';

function getSchema(name = `配置 ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`) {
  return [
    {
      title: '代理设置',
      items: {
        'ss-import': {
          type: 'ss-import',
          label: 'shadowsocks快捷处理',
          disableLabelAppend: true,
          required: false,
        },

        'proxy-type': {
          type: 'select',
          label: '代理类型',
          default: 'ss',
          options: [
            {
              name: 'shadowsocks',
              value: 'ss',
            },
          ],
        },
        'proxy-scope': {
          type: 'select',
          label: '代理范围',
          default: 'bypassCN',
          options: [
            {
              name: '国内直连, 其它翻墙',
              value: 'bypassCN',
            },
            {
              name: '全局翻墙',
              value: 'global',
            },
          ],
        },
        'proxy-timeout': {
          type: 'input',
          inputType: 'number',
          label: '代理超时时间',
          default: 60,
        },

        'ss-host': {
          type: 'input',
          inputType: 'text',
          label: 'shadowsocks服务器',
        },
        'ss-port': {
          type: 'input',
          inputType: 'number',
          label: 'shadowsocks端口',
        },
        'ss-passwd': {
          type: 'password',
          label: 'shadowsocks密码',
        },
        'ss-chpier-method': {
          type: 'select',
          label: 'shadowsocks加密方式',
          default: 'chacha20',
          options: [
            'aes-128-cfb',
            'aes-192-cfb',
            'aes-256-cfb',
            'aes-128-ctr',
            'aes-192-ctr',
            'aes-256-ctr',
            'des-cfb',
            'bf-cfb',
            'cast5-cfb',
            'rc4-md5',
            'chacha20',
            'chacha20-ietf',
            'salsa20',
          ],
        },
      },
    },
    {
      title: '基本设置',
      items: {
        _id: {
          type: 'input',
          inputType: 'text',
          label: 'ID',
          hidden: true,
          required: false,
        },
        name: {
          type: 'input',
          inputType: 'text',
          label: '配置别名',
          default: name,
        },
        'listen-host': {
          type: 'advancedSelect',
          label: '监听地址',
          default: '127.0.0.1',
          options: ['127.0.0.1', '0.0.0.0'],
        },
        'listen-port': {
          type: 'input',
          inputType: 'number',
          label: '监听端口',
          default: 1111,
        },
        'enable-stats': {
          type: 'checkbox',
          label: '状态服务',
          default: false,
        },
        'stats-port': {
          type: 'input',
          inputType: 'number',
          label: '状态接口地址',
          default: 8810,
        },
        'stats-enable-tls-sni-sniffer': {
          type: 'checkbox',
          label: 'tls嗅探',
          default: true,
        },
      },
    },
    DNSSchema,
    blacklistSchema,
  ];
}

function getStepperSchema() {
  const base = cloneDeep(getSchema());
  const first = base.shift();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  set(first!, 'titleHidden', true);

  base.forEach((item) => {
    const { items } = item;
    set(item, 'hidden', true);
    Object.keys(items).forEach((key) => {
      set(items, `${key}.hidden`, true);
    });
  });

  return [first, ...base];
}

export { getSchema, getStepperSchema };
