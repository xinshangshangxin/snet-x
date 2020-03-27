export interface Status {
  isDefault?: boolean;
  configId?: string;
  snetPath?: string;
  snetVersion?: string;
  proxyMode?: 'bypassCN' | 'global' | 'inherit';
  running?: boolean;
  inited?: boolean;
}

export interface SSConfig {
  _id: string;
  name: string;
  isDefault?: boolean;
  'proxy-type': string;
  'proxy-scope': string;
  'proxy-timeout': number;

  'ss-host'?: string;
  'ss-port'?: number;
  'ss-chpier-method'?: string;
  'ss-passwd'?: string;
}

export interface DNSConfig {
  _id: string;
  name: string;
  isDefault?: boolean;

  'cn-dns': string;
  'fq-dns': string;
  'enable-dns-cache': boolean;
  'enforce-ttl': number;
  'disable-qtypes': string[];
  'dns-prefetch-enable': boolean;
  'dns-prefetch-count': number;
  'dns-prefetch-interval': number;
}

export interface BlacklistConfig {
  _id: string;
  name: string;
  isDefault?: boolean;

  'force-fq': string[];
  'block-host-file': string;
  'block-hosts': string[];
  'bypass-hosts': string[];
  'host-map': { [key: string]: string };
}

export type SnetConfig = {
  _id: string;
  name: string;
  order: number;

  'listen-host': string;
  'listen-port': number;
} & ({ ssId: string } | Omit<SSConfig, '_id' | 'name'>) &
  ({ DNSId: string } | Omit<DNSConfig, '_id' | 'name'>) &
  ({ blacklistId: string } | Omit<BlacklistConfig, '_id' | 'name'>) & {
    // mode: string;
    // 'bypass-src-ips': string[];
    // 'http-proxy-host'?: string;
    // 'http-proxy-port'?: number;
    // 'http-proxy-auth-user'?: string;
    // 'http-proxy-auth-password'?: string;
    // 'tls-host'?: string;
    // 'tls-port'?: number;
    // 'tls-token'?: string;
  };
