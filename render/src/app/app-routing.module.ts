import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DetailComponent } from './modules/config/detail/detail.component';
import { ListComponent } from './modules/config/list/list.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { DomainCheckComponent } from './modules/domain-check/domain-check.component';
import { HomeComponent } from './modules/home/home.component';
import { IpCheckComponent } from './modules/ip-check/ip-check.component';
import { PasswordComponent } from './modules/password/password.component';
import { StepperComponent } from './modules/stepper/stepper.component';
import { VersionComponent } from './modules/version/version.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: 'stepper',
        component: StepperComponent,
      },
      {
        path: '',
        component: DashboardComponent,
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'ss-list',
        component: ListComponent,
      },
      {
        path: 'ss-detail',
        component: DetailComponent,
      },
      {
        path: 'password',
        component: PasswordComponent,
      },
      {
        path: 'ip-check',
        component: IpCheckComponent,
      },
      {
        path: 'domain-check',
        component: DomainCheckComponent,
      },
      {
        path: 'version',
        component: VersionComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
