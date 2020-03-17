import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OperatorFunction, pipe, Subject, UnaryFunction } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';

import { LoadingDialogComponent } from './loading-dialog.component';

interface Config {
  timeout?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoadingDialogService {
  private loadingRefNu = 0;

  private dialogRef?: MatDialogRef<LoadingDialogComponent>;

  private isLoading$ = new Subject<{ step: 1 | -1; config?: Config }>();

  constructor(private matDialog: MatDialog) {
    this.isLoading$.subscribe(({ step, config }) => {
      this.loadingRefNu += step;

      if (this.loadingRefNu < 0) {
        console.warn('loading ref nu less than 0');
        this.loadingRefNu = 0;
      }

      if (step === 1 && this.loadingRefNu === 1) {
        this.dialogRef = this.matDialog.open(LoadingDialogComponent, {
          height: '100%',
          width: '100%',
          panelClass: 'loading-dialog',
          backdropClass: 'loading-dialog',
          disableClose: true,
          data: {
            config,
          },
        });
      } else if (this.loadingRefNu === 0) {
        this.dialogRef?.close();
      }
    }, console.warn);
  }

  // public load<T>(): UnaryFunction<T, T>;

  public load<T, A>(fn1: UnaryFunction<T, A>): UnaryFunction<T, A>;

  public load<T, A, B>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>): UnaryFunction<T, B>;

  public load<T, A, B, C>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>
  ): UnaryFunction<T, C>;

  public load<T, A, B, C, D>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>
  ): UnaryFunction<T, D>;

  public load<T, A, B, C, D, E>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>
  ): UnaryFunction<T, E>;

  public load<T, A, B, C, D, E, F>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>
  ): UnaryFunction<T, F>;

  public load<T, A, B, C, D, E, F, G>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>
  ): UnaryFunction<T, G>;

  public load<T, A, B, C, D, E, F, G, H>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>,
    fn8: UnaryFunction<G, H>
  ): UnaryFunction<T, H>;

  public load<T, A, B, C, D, E, F, G, H, I>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>,
    fn8: UnaryFunction<G, H>,
    fn9: UnaryFunction<H, I>
  ): UnaryFunction<T, I>;

  public load<T, A, B, C, D, E, F, G, H, I>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>,
    fn8: UnaryFunction<G, H>,
    fn9: UnaryFunction<H, I>,
    ...fns: UnaryFunction<any, any>[]
  ): UnaryFunction<T, {}>;

  // with config

  public load<T, A>(config: Config, fn1: UnaryFunction<T, A>): UnaryFunction<T, A>;

  public load<T, A, B>(
    config: Config,
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>
  ): UnaryFunction<T, B>;

  public load<T, A, B, C>(
    config: Config,
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>
  ): UnaryFunction<T, C>;

  public load<T, A, B, C, D>(
    config: Config,
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>
  ): UnaryFunction<T, D>;

  public load<T, A, B, C, D, E>(
    config: Config,
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>
  ): UnaryFunction<T, E>;

  public load<T, A, B, C, D, E, F>(
    config: Config,
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>
  ): UnaryFunction<T, F>;

  public load<T, A, B, C, D, E, F, G>(
    config: Config,
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>
  ): UnaryFunction<T, G>;

  public load<T, A, B, C, D, E, F, G, H>(
    config: Config,
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>,
    fn8: UnaryFunction<G, H>
  ): UnaryFunction<T, H>;

  public load<T, A, B, C, D, E, F, G, H, I>(
    config: Config,
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>,
    fn8: UnaryFunction<G, H>,
    fn9: UnaryFunction<H, I>
  ): UnaryFunction<T, I>;

  public load<T, A, B, C, D, E, F, G, H, I>(
    config: Config,
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>,
    fn8: UnaryFunction<G, H>,
    fn9: UnaryFunction<H, I>,
    ...fns: UnaryFunction<any, any>[]
  ): UnaryFunction<T, {}>;

  public load(
    firstArg: Config | OperatorFunction<any, any>,
    ...operations: OperatorFunction<any, any>[]
  ): UnaryFunction<any, any> {
    let config: Config | undefined;
    if (typeof firstArg === 'function') {
      operations.unshift(firstArg);
      config = undefined;
    } else {
      config = firstArg;
    }

    return pipe(
      tap(() => this.start(config)),
      pipe(...(operations as [OperatorFunction<any, any>])),
      config?.timeout && config?.timeout > 0 ? timeout(config?.timeout) : tap(() => {}),
      catchError((e) => {
        this.stop();
        throw e;
      }),
      tap(() => this.stop())
    );
  }

  public start(config?: Config) {
    this.isLoading$.next({
      step: 1,
      config,
    });
  }

  public stop() {
    this.isLoading$.next({
      step: -1,
    });
  }
}
