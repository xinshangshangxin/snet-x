import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { ElectronRouterService } from '../../../core/services/electron-router.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SSConfig } from '../../../core/services/ss-url-decode.service';
import { DialogData, SsImportComponent } from '../ss-import/ss-import.component';

@Component({
  selector: 'app-ss-import-field',
  templateUrl: './ss-import-field.component.html',
  styleUrls: ['./ss-import-field.component.scss'],
})
export class SsImportFieldComponent implements OnInit {
  @Input()
  public formGroup?: FormGroup;

  @Input()
  public item?: {
    key: string;
    value: {
      type: string;
      label: string;
      disableLabelAppend?: boolean;
    };
  };

  constructor(
    private dialog: MatDialog,
    private electronRouterService: ElectronRouterService,
    private notificationService: NotificationService
  ) {}

  public ngOnInit(): void {}

  public openDialog(url?: string) {
    const dialogRef = this.dialog.open<SsImportComponent, DialogData, SSConfig[]>(
      SsImportComponent,
      {
        data: {
          url,
        },
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed', result);

      if (!result || !result.length) {
        return;
      }

      const config = result[0];

      this.formGroup?.patchValue({
        'ss-host': config.server,
        'ss-port': config.port,
        'ss-passwd': config.password,
        'ss-chpier-method': config.method,
      });

      if (config.remarks) {
        this.formGroup?.patchValue({ name: config.remarks });
      }
    }, console.warn);
  }

  public async scan() {
    this.notificationService.open('解析二维码中, 请稍等...');
    const url = await this.electronRouterService.post('qrcode:scan');

    if (!url) {
      this.notificationService.open('未扫描到二维码');
      return;
    }

    if (!/^\s*ssr?:\/\//.test(url)) {
      this.notificationService.open('二维码无法识别');
      return;
    }

    this.openDialog(url);
  }
}
