import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { debounceTime, map, startWith } from 'rxjs/operators';

import { ElectronService } from '../../core/services/electron.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private electronService: ElectronService,
    private ngZone: NgZone
  ) {}

  public async ngOnInit() {
    console.info('get show router state');

    this.electronService.redirectSubject
      .pipe(
        startWith(null),
        debounceTime(200),
        map((redirect) => {
          if (redirect === 'init') {
            return {
              commands: ['/stepper'],
            };
          }

          if (redirect === 'password') {
            return {
              commands: ['/password'],
            };
          }

          if (redirect === 'setting') {
            return {
              commands: undefined,
            };
          }

          if (redirect === 'ss-config') {
            return {
              commands: ['/ss-detail'],
            };
          }

          return { commands: undefined, extras: undefined };
        }),
        untilDestroyed(this)
      )
      .subscribe(({ commands, extras }) => {
        if (commands) {
          this.ngZone.run(() => {
            this.router.navigate(commands, extras);
          });
        }
      }, console.warn);
  }

  public ngOnDestroy(): void {}
}
