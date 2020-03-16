import { Component, OnInit } from '@angular/core';

import { ElectronRouterService } from '../../core/services/electron-router.service';

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

  constructor(private electronRouterService: ElectronRouterService) {}

  public async ngOnInit() {
    await this.check();
  }

  public async check() {
    this.result = undefined;
    this.result = await this.electronRouterService.post('ip:check');
  }
}
