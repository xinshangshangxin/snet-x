import { powerMonitor } from 'electron';
import { EventEmitter } from 'events';
import got from 'got';
import { from, fromEvent, merge, of, timer } from 'rxjs';
import { catchError, filter, map, mapTo, switchMap, take, tap, throttleTime } from 'rxjs/operators';

import { getStatus } from '../storage';
import { instance } from './instance';

function restartSnet() {
  // 先停止
  return from(instance.snet.stop({ persistStatus: false, notify: false, clean: true })).pipe(
    switchMap(() => {
      return from(getStatus());
    }),
    // 获取最新的一次状态
    map((status) => {
      console.info('status: ', status);
      return status.running;
    }),
    take(1),
    // 如果是运行状态, 则继续
    filter((running) => {
      return !!running;
    }),
    switchMap(() => {
      // 每3秒检查下当前网络是否通畅
      return timer(0, 3000).pipe(
        tap((i) => {
          console.info('start interval', i);
        }),
        switchMap(() => {
          return from(got.head('https://www.baidu.com'));
        }),
        filter((data) => {
          console.info('statusCode: ', data.statusCode);
          return data.statusCode === 200 || instance.snet.isRunning;
        }),
        take(1)
      );
    }),
    switchMap(() => {
      // 如果网络通畅, 则启动翻墙
      return from(instance.snet.start({ notify: false }));
    })
  );
}

function onResume() {
  const pm = powerMonitor as EventEmitter;

  return merge(
    fromEvent(pm, 'resume').pipe(mapTo('resume')),
    fromEvent(pm, 'unlock-screen').pipe(mapTo('unlock-screen'))
  ).pipe(
    tap((type) => {
      console.info('trigger with:', type);
    }),
    filter((type) => {
      return type === 'unlock-screen';
    }),
    throttleTime(1000),
    switchMap(() => {
      return restartSnet();
    }),
    catchError((e) => {
      console.warn(e);
      return of(null);
    })
  );
}

export { onResume };
