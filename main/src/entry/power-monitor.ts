import { powerMonitor } from 'electron';
import { EventEmitter } from 'events';
import { from, fromEvent, merge, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';

import { instance } from './instance';

async function restartSnet() {
  if (instance.snet?.isRunning) {
    await instance.snet.stop({ persistStatus: false, notify: false, cleanPf: true });
    await instance.snet.start({ notify: false });
  }
}

function onResume() {
  const pm = powerMonitor as EventEmitter;

  return merge(fromEvent(pm, 'resume'), fromEvent(pm, 'unlock-screen')).pipe(
    debounceTime(200),
    switchMap(() => {
      return from(restartSnet());
    }),
    catchError((e) => {
      console.warn(e);
      return of(null);
    })
  );
}

export { onResume };
