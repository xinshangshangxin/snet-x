import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidator } from '@angular/forms';
import { from, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { ElectronRouterService } from '../services/electron-router.service';

@Injectable({ providedIn: 'root' })
export class PasswordValidator implements AsyncValidator {
  constructor(private electronRouterService: ElectronRouterService) {}

  public validate({ value: inputPassword }: AbstractControl) {
    return timer(1000).pipe(
      switchMap(() => {
        if (!inputPassword) {
          return from(this.electronRouterService.post('password:check'));
        }
        return from(this.electronRouterService.post('password:set', inputPassword));
      }),
      map(() => {
        console.log('password valid');
        return null;
      }),
      catchError((e) => {
        console.log('password invalid', e.message);
        return of({ password: e.message });
      })
    );
  }
}
