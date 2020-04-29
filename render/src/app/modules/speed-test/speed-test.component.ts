import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { untilDestroyed } from 'ngx-take-until-destroy';

import { ElectronRouterService } from '../../core/services/electron-router.service';
import { NotificationService } from '../../core/services/notification.service';

interface UploadProgress {
  type: 'upload';
  timestamp: Date;
  progress: number;
  upload: {
    bandwidth: number;
    bytes: number;
    elapsed: number;
    progress: number;
  };
}

interface PingProgress {
  type: 'ping';
  timestamp: Date;
  progress: number;
  ping: {
    jitter: number;
    latency: number;
    progress: number;
  };
}

interface DownloadProgress {
  type: 'download';
  timestamp: Date;
  progress: number;
  download: {
    bandwidth: number;
    bytes: number;
    elapsed: number;
    progress: number;
  };
}

interface SpeedTestResult {
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

interface DefaultProgress {
  progress: number;
}

@Component({
  selector: 'app-speed-test',
  templateUrl: './speed-test.component.html',
  styleUrls: ['./speed-test.component.scss'],
})
export class SpeedTestComponent implements OnInit, OnDestroy {
  public progress: PingProgress | DownloadProgress | UploadProgress | DefaultProgress = {
    progress: 0,
  };

  public result = SpeedTestComponent.getInitResult();

  public status: 'stopped' | 'starting' | 'running' = 'stopped';

  private notifyId = `speed-test-status-${Date.now()}`;

  constructor(
    private readonly electronRouter: ElectronRouterService,
    private readonly ngZone: NgZone,
    private readonly activatedRoute: ActivatedRoute,
    private readonly notificationService: NotificationService
  ) {}

  public ngOnInit(): void {
    this.electronRouter.register(this.notifyId, async (result: any) => {
      this.ngZone.run(() => {
        this.resolveSpeedTest(result);
      });

      return false;
    });

    this.activatedRoute.queryParams.pipe(untilDestroyed(this)).subscribe(({ run }) => {
      console.info('run: ', run);
      if (run) {
        this.run();
      }
    }, console.warn);
  }

  public async ngOnDestroy() {
    await this.cancel();
    this.unregisterRouter();
  }

  public async run() {
    if (this.status === 'running') {
      this.status = 'stopped';
      await this.cancel();
    } else if (this.status !== 'starting') {
      this.status = 'starting';
      await this.start();
    }
  }

  public async start() {
    this.status = 'starting';
    this.result = SpeedTestComponent.getInitResult();
    await this.electronRouter.post('speed-test:start', { notifyId: this.notifyId });
  }

  public async cancel() {
    await this.electronRouter.post('speed-test:cancel');
    this.status = 'stopped';
  }

  // eslint-disable-next-line class-methods-use-this
  public speedText(speed: number) {
    if (speed === 0) {
      return '--';
    }

    let bits = speed * 8;
    const units = ['', 'K', 'M', 'G', 'T'];
    const places = [0, 1, 2, 3, 3];
    let unit = 0;
    while (bits >= 2000 && unit < 4) {
      unit += 1;
      bits /= 1000;
    }
    return `${bits.toFixed(places[unit])} ${units[unit]}bps`;
  }

  private resolveSpeedTest(
    data: PingProgress | DownloadProgress | UploadProgress | SpeedTestResult | { type: 'error' }
  ) {
    switch (data.type) {
      case 'result':
        this.result = data;
        this.status = 'stopped';
        break;
      case 'error':
        this.status = 'stopped';
        console.warn(data);
        this.notificationService.open('测速失败, 请稍后重试', undefined, { duration: 5000 });
        break;
      default:
        this.status = 'running';
        this.progress = {
          ...data,
          progress: data.progress * 100,
        };

        this.result[data.type] = (data as any)[data.type];
        break;
    }
  }

  private unregisterRouter() {
    this.electronRouter.unregister(this.notifyId);
  }

  private static getInitResult() {
    return {
      ping: { latency: 0 },
      download: { bandwidth: 0 },
      upload: { bandwidth: 0 },
    };
  }
}
