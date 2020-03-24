import { union } from 'lodash';

import bb from 'bluebird';
import { dig } from '../shared/net-tools/dig';
import { checkIp } from '../shared/net-tools/ip';
import { sudoRun } from '../shared/shell/sudo-run';
import { notifyIpResult } from './notification';
import { exec } from '../shared/shell/exec';
import { Errors } from '../shared/project/error';

export class NetCheck {
  public static urlPickDomain = /^(https?:\/\/)?(([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6})/;

  public static domainReg = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/;

  // eslint-disable-next-line class-methods-use-this
  public async checkIp(timeout?: number) {
    const data = await checkIp(timeout);
    console.info('data: ', data);
    return data;
  }

  // eslint-disable-next-line class-methods-use-this
  public async notifyIp(timeout?: number) {
    const list = await checkIp(timeout);

    const message = list
      .map(({ key, group, ...args }) => {
        if (args.error !== null) {
          return `${group}/${key} failed`;
        }

        return `${group}/${key} ${args.shortAddress}`;
      })
      .join('    ');

    notifyIpResult(message);
  }

  // eslint-disable-next-line class-methods-use-this
  public async checkIsFQ(url: string) {
    if (!NetCheck.urlPickDomain.test(url)) {
      throw new Errors.DomainCheckFailed({ msg: 'not valid domain' });
    }

    const domain = RegExp.$2;
    const digResult = await dig(`dig ${domain}`);
    const answerA = digResult.answer
      .filter(({ type }) => {
        return type === 'A';
      })
      .map(({ value }) => {
        return value;
      })
      .sort();

    const checkIpList = union(answerA);

    let isFQ = false;

    await bb
      .all(
        checkIpList.map(async (ip) => {
          const { stdout, stderr } = await sudoRun.runAsync(`pfctl -t BYPASS_SNET -T test ${ip}`, {
            stdio: 'pipe',
          });

          const reg = /(\d+)\/\1\s+addresses\s+match/;
          if (!reg.test(stdout + stderr)) {
            isFQ = true;
          }
        })
      )
      .timeout(4000);

    let head = '';
    if (isFQ) {
      ({ stdout: head } = await bb
        .try(() => {
          return exec(`curl -X HEAD -I ${domain}`);
        })
        .timeout(1000)
        .catch((e) => {
          return { stdout: e.message };
        }));
    }

    return {
      head: head
        .trim()
        .split(/[\r\n]/)
        .shift(),
      domain,
      isFQ,
      digResult,
      answerA,
    };
  }
}

export const netCheck = new NetCheck();
