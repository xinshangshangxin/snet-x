import bb from 'bluebird';
import { union, set } from 'lodash';

import { dig } from '../shared/net-tools/dig';
import { checkIp } from '../shared/net-tools/ip';
import { exec } from '../shared/shell/exec';
import { sudoRun } from '../shared/shell/sudo-run';
import { notifyIpResult } from './notification';

/* eslint-disable class-methods-use-this */

export class NetCheck {
  public static urlPickDomain = /^(https?:\/\/)?(([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6})/;

  public static domainReg = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/;

  public static ipReg = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  public async checkIp(timeout?: number) {
    const data = await checkIp(timeout);
    console.info('data: ', data);
    return data;
  }

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

  public pickDomainOrIp(input: string) {
    const temp = input.trim();
    if (NetCheck.urlPickDomain.test(temp)) {
      return RegExp.$2;
    }

    if (NetCheck.ipReg.test(temp)) {
      return temp;
    }

    return undefined;
  }

  public async checkIpIsFQ(ip: string) {
    const { stdout, stderr } = await sudoRun.runAsync(`pfctl -t BYPASS_SNET -T test ${ip}`, {
      stdio: 'pipe',
    });

    const reg = /(\d+)\/\1\s+addresses\s+match/;
    return !reg.test(stdout + stderr);
  }

  public async checkIsFQ(url: string, domain: string) {
    const digResult = await dig(`dig ${domain}`);

    if (NetCheck.ipReg.test(domain)) {
      set(digResult, 'answer', [{ value: domain, type: 'A' }]);
    }

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
          const data = await this.checkIpIsFQ(ip);
          if (data) {
            isFQ = true;
          }
        })
      )
      .timeout(4000);

    let head = '';
    if (isFQ) {
      ({ stdout: head } = await bb
        .try(() => {
          return exec(`curl -X HEAD -I ${url}`);
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
      url,
      domain,
      isFQ,
      digResult,
      answerA,
    };
  }
}

export const netCheck = new NetCheck();
