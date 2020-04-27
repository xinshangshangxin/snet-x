/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Injectable } from '@angular/core';
import { v4 } from 'uuid';

import { defer, Deferred } from './defer';
import { ElectronService } from './electron.service';

const { ipcRenderer } = ElectronService;

@Injectable({
  providedIn: 'root',
})
export class ElectronRouterService {
  private helloInterval: any = null;

  private connectedDeferred = defer();

  private handles = {} as { [key: string]: Function };

  private deferMap = {} as { [key: string]: Deferred<any> };

  constructor() {
    this.listenMessage();
    this.sendHello();
  }

  public register(cmd: string, fun: Function) {
    this.handles[cmd] = fun;
  }

  public unregister(cmd: string) {
    delete this.handles[cmd];
  }

  public async post<T = any>(
    cmd: string,
    body?: any,
    waitResponse: 'ignore' | number = 10000
  ): Promise<T> {
    await this.connectedDeferred.promise;

    const id = v4();

    console.debug(`request:  ┣ ${cmd} ┫`, body, id);
    ipcRenderer?.send('post', id, cmd, body);

    if (waitResponse === 'ignore') {
      return Promise.resolve({} as T);
    }

    const deferred = defer<T>();
    this.deferMap[id] = deferred;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout'));
      }, waitResponse);
      deferred.promise
        .then((data: any) => {
          if (data && data.type === 'error' && data.code) {
            const e = new Error(data.message);
            Object.assign(e, data);
            throw e;
          }

          resolve(data);
        })
        .catch(reject);
    });
  }

  private sendHello(ms = 1000) {
    ipcRenderer?.send('post', '', 'hello');

    this.helloInterval = setInterval(() => {
      ipcRenderer?.send('post', '', 'hello');
    }, ms);
  }

  private listenMessage() {
    ipcRenderer?.on('post', async (event: any, id: any, cmd: any, body: any, log: boolean) => {
      if (log !== false) {
        console.debug(`response: ┣ ${cmd} ┫`, body, id);
      }

      if (cmd === 'world') {
        console.info('client response world', id);
        clearInterval(this.helloInterval);
        this.connectedDeferred.resolve();
        return;
      }

      if (this.deferMap[id]) {
        this.deferMap[id].resolve(body);
        delete this.deferMap[id];
        return;
      }

      try {
        if (this.handles[cmd]) {
          const result = await this.handles[cmd](body);
          if (result !== false && body.type !== 'error') {
            event.sender.send('post', id, cmd, result);
          }
          return;
        }

        throw new Error('not found');
      } catch (e) {
        console.warn(e, id);

        if (body && body.type === 'error') {
          console.warn(body.code, id);
        }
        // event.sender.send('post', id, cmd, { error: 'unknown', code: 'unknown' });
      }
    });
  }
}
