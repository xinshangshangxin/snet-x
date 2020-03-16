import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-box',
  templateUrl: './box.component.html',
  styleUrls: ['./box.component.scss'],
})
export class BoxComponent implements OnInit {
  @Input()
  public formGroup?: FormGroup;

  @Input()
  public schema?: any;

  public ngOnInit(): void {}

  // eslint-disable-next-line class-methods-use-this
  public asIsOrder() {
    return 1;
  }
}
