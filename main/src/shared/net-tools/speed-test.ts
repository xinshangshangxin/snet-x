import { Observable } from 'rxjs';
import speedTest from 'speedtest-net';

export interface UploadProgress {
  type: string;
  timestamp: Date;
  progress: number;
  upload: {
    bandwidth: number;
    bytes: number;
    elapsed: number;
    progress: number;
  };
}

export interface PingProgress {
  type: string;
  timestamp: Date;
  progress: number;
  ping: {
    jitter: number;
    latency: number;
    progress: number;
  };
}

export interface DownloadProgress {
  type: string;
  timestamp: Date;
  progress: number;
  download: {
    bandwidth: number;
    bytes: number;
    elapsed: number;
    progress: number;
  };
}

export interface SpeedTestResult {
  type: 'result';
  timestamp: string;
  ping: {
    jitter: number;
    latency: number;
  };
  download: {
    bandwidth: number;
    bytes: number;
    elapsed: number;
  };
  upload: {
    bandwidth: number;
    bytes: number;
    elapsed: number;
  };
  packetLoss: number;
  isp: string;
  interface: {
    internalIp: string;
    name: string;
    macAddr: string;
    isVpn: boolean;
    externalIp: string;
  };
  server: {
    id: number;
    // eslint-disable-next-line camelcase
    host_functional: string;
    name: string;
    location: string;
    country: string;
    host: string;
    port: number;
    ip: string;
  };
  result: {
    id: string;
    url: string;
  };
}

function speed(speedTestParams?: any) {
  return new Observable<PingProgress | DownloadProgress | UploadProgress | SpeedTestResult>(
    (observer) => {
      const cancel = speedTest.makeCancel();

      speedTest({
        acceptLicense: true,
        cancel,
        progress: (data: any) => {
          observer.next(data);
        },
        ...speedTestParams,
      })
        .then((data: Omit<SpeedTestResult, 'type'>) => {
          observer.next({
            type: 'result',
            ...data,
          });
          observer.complete();
        })
        .catch((e: Error) => {
          observer.error(e);
        });

      return () => {
        console.debug('cancel speed test');
        cancel();
      };
    }
  );
}

export { speed };
