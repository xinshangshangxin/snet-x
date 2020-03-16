import { NgModule } from '@angular/core';

import { ElectronRouterService } from './services/electron-router.service';
import { ElectronService } from './services/electron.service';
import { FormGroupGenerateService } from './services/form-group-generate.service';
import { SsUrlDecodeService } from './services/ss-url-decode.service';
import { NotificationService } from './services/notification.service';

@NgModule({
  providers: [
    ElectronRouterService,
    FormGroupGenerateService,
    SsUrlDecodeService,
    ElectronService,
    NotificationService,
  ],
})
export class CoreModule {}
