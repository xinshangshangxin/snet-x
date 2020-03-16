import { app, BrowserWindow } from 'electron';
import { ReplaySubject } from 'rxjs';

import { Router } from '../shared/ipc/router';
import { Snet } from '../snet';

export enum QuitAppStatus {
  // 阻止本次退出
  block = 'block',
  // 延迟退出
  delay = 'delay',
  // 允许
  allow = 'allow',
}

class Instance {
  private snetInstance: Snet | null = null;

  public quitAppStatus = QuitAppStatus.delay;

  public redirectSubject = new ReplaySubject<string>(1);

  public win: BrowserWindow | null = null;

  public router: Router | null = null;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    app.redirectSubject = this.redirectSubject;
  }

  public createSnet() {
    if (this.snetInstance) {
      throw new Error('snet exists');
    }

    this.snetInstance = new Snet();
  }

  public get snet() {
    if (!this.snetInstance) {
      this.snetInstance = new Snet();
    }

    return this.snetInstance;
  }
}

export const instance = new Instance();
