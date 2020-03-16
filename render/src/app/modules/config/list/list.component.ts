import { Component, Input, OnInit } from '@angular/core';

import { ElectronRouterService } from '../../../core/services/electron-router.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  public configs?: any[];

  private serverConfigs?: any[];

  @Input()
  public search?: string;

  constructor(private electronRouter: ElectronRouterService) {}

  public async ngOnInit() {
    this.serverConfigs = await this.electronRouter.post('config:query');

    this.configs = this.serverConfigs?.slice(0);

    if (this.search) {
      this.filter(this.search);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public keyup(e: KeyboardEvent) {
    console.info(e);

    const { value } = e.target as HTMLInputElement;

    if (!value) {
      this.configs = this.serverConfigs?.slice(0);
      return;
    }

    this.filter(value);
  }

  private filter(search: string) {
    const value = search.toLocaleLowerCase();
    this.configs = this.serverConfigs?.filter((item) => {
      return (
        item.name.toLocaleLowerCase().includes(value) ||
        item['ss-host'].toLocaleLowerCase().includes(value)
      );
    });
  }
}
