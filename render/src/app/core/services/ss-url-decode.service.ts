import { Injectable } from '@angular/core';
import { fromPairs } from 'lodash';

export interface SSConfig {
  server: string;
  port: string;
  protocol?: string;
  method: string;
  obfs?: string;
  password: string;
  remarks?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SsUrlDecodeService {
  public static utf82b64(str: string) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  public static b642utf8(str: string) {
    return decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
  }

  public static decode(url: string, multi: true): SSConfig[];

  public static decode(url: string, multi: false): SSConfig;

  public static decode(url: string): SSConfig;

  public static decode(url: string, multi = false) {
    const lines = url.trim().split(/[\r\n]/);

    if (!multi) {
      return SsUrlDecodeService.decodeLine(lines[0]);
    }

    return lines
      .map((line) => {
        try {
          return SsUrlDecodeService.decodeLine(line);
        } catch (e) {
          return undefined;
        }
      })
      .filter((item): item is SSConfig => {
        return !!item;
      });
  }

  public static decodeLine(u: string) {
    if (/^ssr/.test(u)) {
      return SsUrlDecodeService.decodeSSR(u.replace(/^ssr:\/\//, ''));
    }
    if (/^ss/.test(u)) {
      return SsUrlDecodeService.decodeSS(u.replace(/^ss:\/\//, ''));
    }

    throw new Error('parse failed');
  }

  public static decodeSS(content: string) {
    const [left, right] = content.split('#');

    const remarks = decodeURIComponent(right || '') || undefined;
    const code = SsUrlDecodeService.b642utf8(left);

    const arr = code.split(/:|@/);

    return {
      server: arr[2],
      port: arr[3],
      protocol: undefined,
      method: arr[0],
      obfs: undefined,
      password: arr[1],
      remarks,
    };
  }

  public static decodeSSR(content: string): SSConfig {
    const code = SsUrlDecodeService.b642utf8(content);
    const arr = code.split(':');

    const e = new Error('parse failed');

    if (arr.length < 6) {
      throw e;
    }

    const [pwdB64, params] = arr.pop()?.split(/\/\??/) || [];

    if (!pwdB64) {
      throw e;
    }

    const { remarks } = fromPairs(
      params.split(/[?&]/).map((str) => {
        const [key, value] = str.split('=');

        if (!key) {
          return [undefined, undefined];
        }

        if (!value) {
          return [key, undefined];
        }

        return [key, SsUrlDecodeService.b642utf8(value)];
      })
    );

    return {
      server: arr[0],
      port: arr[1],
      protocol: arr[2],
      method: arr[3],
      obfs: arr[4],
      password: SsUrlDecodeService.b642utf8(pwdB64),

      remarks,
    };
  }
}
