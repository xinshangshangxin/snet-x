export const DNSSchema = {
  title: 'DNS',
  items: {
    'cn-dns': {
      type: 'input',
      inputType: 'text',
      label: '国内DNS',
      default: '223.5.5.5',
    },
    'fq-dns': {
      type: 'input',
      inputType: 'text',
      label: '国外DNS',
      default: '8.8.8.8',
    },
    'enable-dns-cache': {
      type: 'checkbox',
      label: '缓存DNS',
      default: true,
    },
    'enforce-ttl': {
      type: 'input',
      inputType: 'number',
      label: '覆盖ttl',
      default: 3600,
    },
    'disable-qtypes': {
      type: 'advancedSelect',
      advancedSelectType: 'inputTag',
      label: '禁止DNS缓存类型',
      default: ['AAAA'],
    },
    'dns-prefetch-enable': {
      type: 'checkbox',
      label: 'DNS预取',
      default: true,
    },
    'dns-prefetch-count': {
      type: 'input',
      inputType: 'number',
      label: '预取最近DNS数量',
      default: 100,
    },
    'dns-prefetch-interval': {
      type: 'input',
      inputType: 'number',
      label: 'DNS预取间隔',
      default: 60,
    },
  },
};
