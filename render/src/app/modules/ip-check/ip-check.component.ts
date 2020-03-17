import { Component, OnInit } from '@angular/core';

import { ElectronRouterService } from '../../core/services/electron-router.service';
import { LoadingDialogService } from '../../loading-dialog/loading-dialog.service';

@Component({
  selector: 'app-ip-check',
  templateUrl: './ip-check.component.html',
  styleUrls: ['./ip-check.component.scss'],
})
export class IpCheckComponent implements OnInit {
  public result?: {
    key: string;
    group: string;
    ip: string;
    address: string;
    shortAddress: string;
    raw: any;
  }[];

  public displayedColumns: string[] = ['group', 'ip', 'shortAddress', 'key'];

  constructor(
    private electronRouterService: ElectronRouterService,
    private loadingDialogService: LoadingDialogService
  ) {}

  public async ngOnInit() {
    await this.check();
  }

  public async check() {
    this.result = undefined;

    this.loadingDialogService.start({ message: 'IP 检测中...' });
    try {
      this.result = await this.electronRouterService.post('ip:check');
    } catch (e) {
      console.warn(e);
    }
    this.loadingDialogService.stop();
  }
}
