import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingBarService } from '@ngx-loading-bar/core';
import { LoadingBarState } from '@ngx-loading-bar/core/loading-bar.state';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { from, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

import { ElectronRouterService } from '../../core/services/electron-router.service';

interface Section {
  type: string;
  value: string;
}

interface DigResult {
  domain: string;
  answer: Section[];
  additional: Section[];
  time: number;
  server: string;
  datetime: string;
  size: number;
}

interface CheckResult {
  isFQ: boolean;
  digResult: DigResult;
  answerA: string[];
  head: string;
  domain: string;
}

@Component({
  selector: 'app-domain-check',
  templateUrl: './domain-check.component.html',
  styleUrls: ['./domain-check.component.scss'],
})
export class DomainCheckComponent implements OnInit, OnDestroy {
  @Input()
  public domain?: string;

  @ViewChild('myInput')
  public myInput?: ElementRef<HTMLInputElement>;

  public loading = false;

  public checkResult$ = new Observable<CheckResult | undefined>();

  public error?: Error;

  private domain$ = new Subject<string>();

  private loadingState: LoadingBarState;

  constructor(
    private electronRouterService: ElectronRouterService,
    private readonly loadingBarService: LoadingBarService,
    private readonly activatedRoute: ActivatedRoute
  ) {
    this.loadingState = this.loadingBarService.useRef();
  }

  public ngOnInit(): void {
    this.checkResult$ = this.check();

    this.activatedRoute.queryParams
      .pipe(
        startWith({ domain: this.domain }),
        debounceTime(200),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe(({ domain }) => {
        console.info('domain: ', domain);
        this.domain$.next(domain || 'google.com');
      }, console.warn);
  }

  public ngOnDestroy() {
    this.loadingState.stop();
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.myInput?.nativeElement.focus();
    }, 0);
  }

  public async keyup(e: KeyboardEvent) {
    if (e.keyCode !== 13) {
      this.domain$.next();
      return;
    }

    this.domain$.next((e.target as HTMLInputElement).value);
  }

  private check() {
    return this.domain$.pipe(
      tap(() => {
        this.error = undefined;
      }),
      filter((domain) => {
        return !!domain;
      }),
      tap(() => {
        if (!this.loading) {
          this.loadingState.start();
        }

        this.loading = true;
      }),
      switchMap((domain) => {
        return from(this.electronRouterService.post<CheckResult>('domain:check', domain)).pipe(
          catchError((e) => {
            console.warn(e);

            this.error = e;
            return of(undefined);
          })
        );
      }),
      tap(() => {
        this.loading = false;

        this.loadingState.complete();
      })
    );
  }
}
