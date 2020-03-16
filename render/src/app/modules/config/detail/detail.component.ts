import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ElectronRouterService } from '../../../core/services/electron-router.service';
import { FormGroupGenerateService } from '../../../core/services/form-group-generate.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnInit, OnDestroy {
  @Input()
  public scope = 'config:schema';

  public group?: FormGroup;

  public configSchema?: any[];

  public isSaving = false;

  constructor(
    private electronRouter: ElectronRouterService,
    private formGroupGenerateService: FormGroupGenerateService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  public async ngOnInit() {
    this.configSchema = await this.electronRouter.post<any[]>(this.scope);
    console.info(this.configSchema);

    this.activatedRoute.queryParams
      .pipe(
        switchMap(({ configId }) => {
          if (!configId) {
            return of(undefined);
          }

          return from(this.electronRouter.post('config:get', configId));
        }),
        untilDestroyed(this)
      )
      .subscribe(
        (data) => {
          console.info('config:', data);
          this.loadGroup(data);
        },
        (e) => {
          console.error(e);
        },
        () => {
          console.info('this.activatedRoute complete');
        }
      );
  }

  public loadGroup(data: any) {
    this.group = this.formGroupGenerateService.loadGroup(data, this.configSchema);
    console.info('this.group: ', this.group);
  }

  public async remove() {
    this.isSaving = true;

    await this.electronRouter.post('config:remove', this.group?.value._id);
    this.notificationService.open('删除成功');
    this.router.navigate(['/ss-list']);
  }

  public async save() {
    this.isSaving = true;
    console.info(this.group?.valid, this.group?.value);

    if (!this.group?.valid) {
      this.isSaving = false;

      this.notificationService.open('请填写完整');
      return;
    }

    await this.electronRouter.post('config:save', this.group.value);
    this.notificationService.open('保存成功');

    this.router.navigate(['/ss-list']);
  }

  public ngOnDestroy(): void {}
}
