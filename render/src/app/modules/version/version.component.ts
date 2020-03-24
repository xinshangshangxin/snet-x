import { Component, OnDestroy, OnInit } from '@angular/core';

import { ElectronRouterService } from '../../core/services/electron-router.service';
import { NotificationService } from '../../core/services/notification.service';

interface ReleaseInfo {
  version: string;
  downloadUrl: string;
  name: string;
}

interface UpdateStatus {
  version: string;
  latest: string;
  update: boolean;
  release: ReleaseInfo;
}

const notifyId = 'download-status';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss'],
})
export class VersionComponent implements OnInit, OnDestroy {
  public isUpdateLoading = false;

  public version?: {
    core: string;
    defaultCore: string;
    ui: string;
  };

  public availableList?: {
    version: string;
    dir?: string;
    bin: string;
  }[];

  public progress = 0;

  public updateStatus?: UpdateStatus;

  constructor(
    private readonly electronRouter: ElectronRouterService,
    private readonly notificationService: NotificationService
  ) {}

  public async ngOnInit() {
    await this.load();
  }

  public get isDownloading() {
    return this.updateStatus?.update && this.progress !== 0;
  }

  public async checkUpdate() {
    this.isUpdateLoading = true;
    try {
      this.updateStatus = await this.electronRouter.post<UpdateStatus>('snet:can-update');
    } catch (e) {
      console.warn(e);
    }
    this.isUpdateLoading = false;
  }

  public ngOnDestroy(): void {
    this.unregisterRouter();
  }

  public async update() {
    this.unregisterRouter();

    this.electronRouter.register(notifyId, async (result: any) => {
      console.info(result);

      switch (result.type) {
        case 'complete':
          this.notificationService.open(`更新成功 ${result.version}`);
          this.progress = 0;
          await this.electronRouter.post('snet:set-version', result);
          this.load();
          break;
        case 'progress':
          this.progress = result.percent * 100;
          break;
        case 'error':
          this.notificationService.open(result.message);
          break;
        default:
          console.info(result.type);
      }

      return false;
    });

    this.notificationService.open('查询中...');
    await this.electronRouter.post('snet:update', { notifyId, checkIsFQ: false });
    this.notificationService.open('下载中...');
  }

  private unregisterRouter() {
    this.electronRouter.unregister(notifyId);
  }

  private async getVersion() {
    this.version = await this.electronRouter.post('snet:version');
  }

  private async list() {
    this.availableList = await this.electronRouter.post('snet:list');
  }

  private async load() {
    await Promise.all([this.getVersion(), this.checkUpdate(), this.list()]);
  }
}
