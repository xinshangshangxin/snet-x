import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { ElectronRouterService } from '../../core/services/electron-router.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.scss'],
})
export class PasswordComponent implements OnInit, AfterViewInit {
  public disabled = false;

  public inputValue = '';

  @ViewChild('myInput')
  public myInput?: ElementRef<HTMLInputElement>;

  constructor(
    private electronRouterService: ElectronRouterService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  public ngOnInit(): void {}

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.myInput?.nativeElement.focus();
    }, 0);
  }

  public async savePassword() {
    await this.actionPassword('password:set', this.inputValue);
  }

  public cancel() {
    this.router.navigate(['/dashboard']);
  }

  public async checkPassword() {
    await this.actionPassword('password:check');
  }

  private async actionPassword(cmd: 'password:check' | 'password:set', body?: any) {
    this.disabled = true;
    try {
      await this.electronRouterService.post(cmd, body);

      this.notificationService.open('密码正确');

      this.inputValue = '';
    } catch (e) {
      console.warn(e);

      if (e.code === 'NoSnetConfigFound') {
        this.notificationService.open(`密码正确, 但启动失败: ${e.message}`);
        this.router.navigate(['/ss-detail']);
      } else {
        this.notificationService.open(e.message);
      }
    }
    this.disabled = false;
  }
}
