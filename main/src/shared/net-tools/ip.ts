import BB from 'bluebird';
import got from 'got';
import iconv from 'iconv-lite';

interface MyIpResult {
  ip: string;
  address: string;
  shortAddress: string;
  raw: any;
}

const curlClient = got.extend({
  headers: {
    'user-agent': 'curl/7.54.0',
  },
});

async function cip(): Promise<MyIpResult> {
  const body = await curlClient('http://cip.cc').text();

  const arr = body.trim().split(/[\r\n]/);

  if (arr.length < 3) {
    throw new Error(`cip no match found, raw: ${body}`);
  }

  const ip = (arr[0].split(':')[1] || '').trim();
  const address = `${arr[1].split(':')[1] || ''} ${arr[2].split(':')[1] || ''}`.trim();

  if (!ip) {
    throw new Error(`cip no match found, raw: ${body}`);
  }

  return {
    ip,
    address: address.replace(/\s+/g, ''),
    shortAddress:
      address
        .split(/\s+/)
        .slice(-2)
        .shift() || '',
    raw: body,
  };
}

async function ipinfo(): Promise<MyIpResult> {
  const body = await curlClient('http://ipinfo.io').json<any>();

  if (!body.ip) {
    throw new Error(`ipinfo no match found, raw: ${body}`);
  }

  return {
    ip: body.ip,
    address: `${body.country || ''} ${body.region || ''} ${body.city || ''} ${body.org || ''}`,
    shortAddress: `${body.country || body.region || ''} ${body.city || ''}`,
    raw: body,
  };
}

async function ipapi(): Promise<MyIpResult> {
  const body = await curlClient('http://ip-api.com/json', { encoding: 'ascii' }).json<any>();

  if (!body.query) {
    throw new Error(`ipapi no match found, raw: ${JSON.stringify(body)}`);
  }

  return {
    ip: body.query,
    address: `${body.country || ''} ${body.city || ''} ${body.org}`,
    shortAddress: `${body.country || body.regionName || ''} ${body.city || ''}`,
    raw: body,
  };
}

async function pconline() {
  const buffer = await curlClient('http://whois.pconline.com.cn/ipJson.jsp?json=true', {
    responseType: 'buffer',
  }).buffer();

  const body = iconv.decode(buffer, 'gbk');

  let obj: any;
  try {
    obj = JSON.parse(body);
  } catch (e) {
    obj = {};
  }

  if (!obj.ip) {
    throw new Error(`pconline no match found, raw: ${body}`);
  }

  return {
    ip: obj.ip,
    address: obj.addr,
    shortAddress: obj.city || obj.addr,
    raw: obj,
  };
}

const ipList = [
  {
    key: 'whois.pconline.com.cn',
    fun: pconline,
    group: 'cn',
  },
  {
    key: 'cip.cc',
    fun: cip,
    group: 'cn',
  },
  {
    key: 'ip-api.com',
    fun: ipapi,
    group: 'foreign',
  },
  {
    key: 'ipinfo.io',
    fun: ipinfo,
    group: 'foreign',
  },
];

async function checkIp(timeout = 5000) {
  return BB.map(ipList, async ({ key, fun, group }) => {
    return BB.try(() => {
      return fun();
    })
      .timeout(timeout)
      .then((data) => {
        return {
          key,
          group,
          error: null,
          ...data,
        };
      })
      .catch((error: Error) => {
        return { key, group, error };
      });
  });
}

export { checkIp };
