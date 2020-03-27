import { Component, Input, OnInit } from '@angular/core';
import { NgsgOrderChange } from 'ng-sortgrid';
import { ElectronRouterService } from '../../../core/services/electron-router.service';

@Component({
  selector: 'app-config-ss-list',
  templateUrl: './config-ss-list.component.html',
  styleUrls: ['./config-ss-list.component.scss'],
})
export class ConfigSsListComponent implements OnInit {
  @Input()
  public configs: any[] = [];

  @Input()
  public drag = false;

  public isActive = false;

  constructor(private readonly electronRouterService: ElectronRouterService) {}

  public ngOnInit() {}

  public async sorted(v: NgsgOrderChange<any>) {
    console.info(v);

    this.isActive = false;

    await this.electronRouterService.post(
      'config:order',
      v.currentOrder.map(({ _id }, index) => {
        return { _id, order: index };
      })
    );
  }

  public setActive(value: boolean) {
    this.isActive = value;
  }

  public prevent(e: DragEvent) {
    console.info('this.isActive: ', this.isActive);
    if (!this.isActive) {
      e.preventDefault();
      return false;
    }

    return true;
  }
}
