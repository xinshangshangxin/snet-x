import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { DetailComponent } from './modules/config/detail/detail.component';
import { HomeComponent } from './modules/home/home.component';
import { ShareModule } from './share/share.module';
import { BoxComponent } from './modules/config/box/box.component';
import { ListComponent } from './modules/config/list/list.component';
import { SsImportComponent } from './modules/config/ss-import/ss-import.component';
import { SsImportFieldComponent } from './modules/config/ss-import-field/ss-import-field.component';
import { PasswordComponent } from './modules/password/password.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { IpCheckComponent } from './modules/ip-check/ip-check.component';
import { DomainCheckComponent } from './modules/domain-check/domain-check.component';
import { ConfigSsListComponent } from './modules/config/config-ss-list/config-ss-list.component';
import { StepperComponent } from './modules/stepper/stepper.component';


@NgModule({
  entryComponents: [],
  declarations: [
    AppComponent,
    HomeComponent,
    DetailComponent,
    BoxComponent,
    ListComponent,
    SsImportComponent,
    SsImportFieldComponent,
    PasswordComponent,
    DashboardComponent,
    IpCheckComponent,
    DomainCheckComponent,
    ConfigSsListComponent,
    StepperComponent,
  ],
  imports: [CoreModule, ShareModule, AppRoutingModule],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
