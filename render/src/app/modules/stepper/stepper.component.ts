import { CdkStepper } from '@angular/cdk/stepper';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, of } from 'rxjs';
import { catchError, filter, map, take, tap } from 'rxjs/operators';

import { ElectronRouterService } from '../../core/services/electron-router.service';
import { FormGroupGenerateService } from '../../core/services/form-group-generate.service';
import { NotificationService } from '../../core/services/notification.service';
import { PasswordValidator } from '../../core/validators/password.validator';

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
})
export class StepperComponent implements OnInit, AfterViewInit {
  @ViewChild('stepper')
  public stepper?: CdkStepper;

  public passwordFormGroup: FormGroup = this.fb.group({
    password: new FormControl('', {
      asyncValidators: [this.passwordValidator.validate.bind(this.passwordValidator)],
      updateOn: 'blur',
    }),
  });

  public configFormGroup?: FormGroup;

  public configSchema?: any[];

  public loading = false;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private router: Router,
    private electronRouterService: ElectronRouterService,
    private formGroupGenerateService: FormGroupGenerateService,
    private passwordValidator: PasswordValidator
  ) {}

  public async ngOnInit() {
    this.configSchema = await this.electronRouterService.post<any[]>('config:stepper-schema');
    console.info('this.configSchema: ', this.configSchema);

    this.configFormGroup = this.formGroupGenerateService.loadGroup({}, this.configSchema);
    console.info('this.group: ', this.configFormGroup);
  }

  public async ngAfterViewInit() {
    setTimeout(() => {
      this.passwordNext();
    }, 0);
  }

  public get passwordControl() {
    return this.passwordFormGroup.get('password');
  }

  public get passwordError() {
    return (
      (this.passwordFormGroup.dirty || this.passwordFormGroup.touched) &&
      this.passwordControl?.errors?.password
    );
  }

  public async configNext() {
    console.info(this.configFormGroup?.valid, this.configFormGroup?.value);

    if (!this.configFormGroup?.valid) {
      this.notificationService.open('请填写完整');
      return;
    }

    this.loading = true;
    await this.electronRouterService.post('config:save', this.configFormGroup.value);
    await this.electronRouterService.post('snet:inited');
    this.loading = false;

    this.stepper?.next();
  }

  public async passwordNext() {
    console.info(this.passwordControl?.errors);

    this.loading = true;
    // https://github.com/angular/angular/issues/14542#issuecomment-378584574
    interval(250)
      .pipe(
        map(() => this.passwordFormGroup.status),
        filter((status) => status !== 'PENDING'),
        take(1),
        tap(() => {
          this.loading = false;
        }),
        catchError(() => {
          this.loading = false;
          return of(null);
        }),
        filter((status) => {
          return status === 'VALID';
        })
      )
      .subscribe(() => {
        this.stepper?.next();
      }, console.warn);
  }

  public async run() {
    await this.electronRouterService.post('snet:start');
    this.router.navigate(['/dashboard']);
  }
}
