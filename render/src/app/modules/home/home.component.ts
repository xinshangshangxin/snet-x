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
          switch (redirect) {
            case 'ss-config':
              return ['/ss-detail'];
            case 'init':
            case 'password':
            case 'ip':
            case 'domain':
            case 'log':
            case 'nedb':
              return { search: redirect };
            default:
              return undefined;
          }
        }),
        map(
          (
            v?:
              | string
              | [string]
              | any[]
              | { commands?: string[]; extras?: any }
              | { [key: string]: any; commands?: any }
          ) => {
            if (v === undefined) {
              return { commands: undefined, extras: undefined };
            }

            if (typeof v === 'string') {
              return { commands: [v], extras: undefined };
            }

            if (Array.isArray(v)) {
              return { commands: v, extras: undefined };
            }

            if (!v.commands) {
              return {
                commands: ['/'],
                extras: {
                  queryParams: v,
                },
              };
            }

            return v;
          }
        ),
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
