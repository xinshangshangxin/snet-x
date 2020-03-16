import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-config-ss-list',
  templateUrl: './config-ss-list.component.html',
  styleUrls: ['./config-ss-list.component.scss'],
})
export class ConfigSsListComponent implements OnInit {
  @Input()
  public configs?: any[];

  public ngOnInit() {}
}
