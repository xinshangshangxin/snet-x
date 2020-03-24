import { Injectable } from '@angular/core';
import { OpenExternalOptions, RendererInterface } from 'electron';
import { Observable, ReplaySubject, Subscription } from 'rxjs';

let electron:
  | (RendererInterface & {
      remote: {
        app: {
          redirectSubject: Observable<string>;
        };
      };
    })
  | undefined;

try {
  /* eslint-disable */
  // @ts-ignore
   electron = __non_webpack_require__('electron') as { remote: any };
  /* eslint-enable */

  console.info('run under electron');
} catch (e) {
  console.info('run under browser');
}

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  public static electron = electron;

  public static remote = electron?.remote;

  public static ipcRenderer = electron?.ipcRenderer;

  public static readText(): string | undefined {
    return electron?.clipboard?.readText();
  }

  public redirectSubject = new ReplaySubject<string>(1);

  private subscription?: Subscription;

  constructor() {
    this.subscription = ElectronService.remote?.app?.redirectSubject?.subscribe((data) => {
      if (data === 'destroy') {
        this.redirectSubject.complete();
        this.subscription?.unsubscribe();
        return;
      }

      console.info('ElectronService redirectSubject data: ', data);
      this.redirectSubject.next(data);
    }, console.warn);
  }

  public static async open(url: string, options?: OpenExternalOptions) {
    return electron?.shell.openExternal(url, options);
  }
}
