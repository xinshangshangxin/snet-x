import { Component } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet><ngx-loading-bar></ngx-loading-bar>',
})
export class AppComponent {
  constructor() {
    console.info('app build version: ', environment.build);
  }
}
