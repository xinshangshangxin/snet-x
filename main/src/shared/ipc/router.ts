import BB from 'bluebird';
import { ipcMain, WebContents } from 'electron';
import { v4 } from 'uuid';

import { defer, Deferred } from '../defer';
import { isDev } from '../project/env';
import { Errors, OperationalError, try2error } from '../project/error';

export class Router {
  private helloInterval: any = null;

  private connectedDeferred = defer();

  private handles = {} as { [key: string]: Function };

  private deferMap = {} as { [key: string]: Deferred<any> };

  constructor(private webContents: WebContents) {
    this.listenMessage();
  }

  public register(cmd: string, fun: Function) {
    this.handles[cmd] = fun;
  }

  public async post(
    cmd: string,
    body?: any,
    waitResponse: 'ignore' | number = 'ignore',
    log = true
  ) {
    await this.connectedDeferred.promise;

    const id = v4();

    if (log !== false) {
      console.debug('server request:  ', { id, cmd, body });
    }

    this.webContents.send('post', id, cmd, body, log);

    if (waitResponse === 'ignore') {
      return BB.resolve();
    }

    const deferred = defer();
    this.deferMap[id] = deferred;

    return BB.resolve()
      .then(() => {
        return deferred.promise;
      })
      .timeout(waitResponse);
  }

  public destroy() {
    ipcMain.removeAllListeners();
    clearInterval(this.helloInterval);

    Object.entries(this.handles).forEach(([key]) => {
      delete this.handles[key];
    });

    Object.entries(this.deferMap).forEach(([key]) => {
      delete this.deferMap[key];
    });

    this.handles = {};
    this.deferMap = {};
  }

  private listenMessage() {
    ipcMain.on('post', async (event, id, cmd, body) => {
      if (cmd === 'hello') {
        console.info('client say hello');
        event.sender.send('post', id, 'world');
        clearInterval(this.helloInterval);
        this.connectedDeferred.resolve();
        return;
      }

      const parsed = try2error(body);

      if (this.deferMap[id]) {
        console.info('client response:  ', { id, cmd, body });

        if (parsed instanceof OperationalError) {
          this.deferMap[id].reject(parsed);
        } else {
          this.deferMap[id].resolve(body);
        }

        delete this.deferMap[id];
        return;
      }

      if (parsed instanceof OperationalError) {
        console.warn(parsed);
        return;
      }

      try {
        if (this.handles[cmd]) {
          if (/password/.test(cmd)) {
            console.info('client request:  ', { id, cmd, body: isDev ? body : 'not show' });
          } else {
            console.info('client request:  ', { id, cmd, body });
          }

          const result = await this.handles[cmd](body);
          event.sender.send('post', id, cmd, result);

          if (/config/.test(cmd)) {
            console.info('server response: ', { id, cmd, result: 'not show' });
          } else {
            console.info('server response: ', { id, cmd, result });
          }
          return;
        }

        throw new Errors.NoHandleFound({ id, cmd, body });
      } catch (e) {
        console.warn(e);

        let error: OperationalError;
        if (e instanceof OperationalError) {
          error = e;
        } else {
          error = new Errors.Unknown({ msg: e.message });
        }

        event.sender.send('post', id, cmd, {
          ...error.toJSON(),
          id,
          cmd,
        });
      }
    });
  }
}
