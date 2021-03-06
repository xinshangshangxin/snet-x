import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';

import { ElectronRouterService } from '../../core/services/electron-router.service';
import { NotificationService } from '../../core/services/notification.service';
import { ElectronService } from '../../core/services/electron.service';

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

  public progress?: number;

  public updateStatus?: { core: UpdateStatus; ui: UpdateStatus };

  constructor(
    private readonly electronRouter: ElectronRouterService,
    private readonly notificationService: NotificationService,
    private readonly ngZone: NgZone
  ) {}

  public async ngOnInit() {
    await this.load();

    this.electronRouter.register(notifyId, async (result: any) => {
      this.ngZone.run(() => {
        this.resolveUpdate(result);
      });

      return false;
    });
  }

  public get isDownloading() {
    return this.updateStatus?.core.update && this.progress !== undefined;
  }

  public async checkUpdate() {
    this.isUpdateLoading = true;
    try {
      this.updateStatus = await this.electronRouter.post('snet:can-update');
    } catch (e) {
      console.warn(e);

      this.notificationService.open('检查最新版本失败, 请稍后再试...');
    }
    this.isUpdateLoading = false;
  }

  public ngOnDestroy(): void {
    this.unregisterRouter();
  }

  public async update() {
    this.notificationService.open('查询中...');
    await this.electronRouter.post('snet-core:update', { notifyId, checkIsFQ: false });
    this.notificationService.open('下载中...');
    this.progress = 0;
  }

  public async openUiDownloadUrl() {
    const url = this.updateStatus?.ui.release.downloadUrl;
    if (!url) {
      this.notificationService.open('下载失败');
      return;
    }

    this.notificationService.open('打开浏览器中...');
    ElectronService.open(url);
  }

  private unregisterRouter() {
    this.electronRouter.unregister(notifyId);
  }

  private async getVersion() {
    this.version = await this.electronRouter.post('snet:version');
  }

  private async list() {
    this.availableList = await this.electronRouter.post('snet-core:list');
  }

  private async load() {
    await Promise.all([this.getVersion(), this.checkUpdate(), this.list()]);
  }

  private async resolveUpdate(result: any) {
    switch (result.type) {
      case 'complete':
        this.notificationService.open(`更新成功 ${result.version}`);
        this.progress = undefined;
        await this.electronRouter.post('snet-core:set-version', result);
        this.load();
        break;
      case 'progress':
        this.progress = result.percent * 100;
        break;
      case 'error':
        this.progress = undefined;
        this.notificationService.open(result.message);
        break;
      default:
        console.info(result.type);
    }
  }
}
