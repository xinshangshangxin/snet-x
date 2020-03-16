import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'field-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
})
export class CheckboxComponent implements OnInit {
  @Input()
  public formGroup?: FormGroup;

  @Input()
  public item?: {
    key: string;
    value: {
      type: string;
      label: string;
      disableLabelAppend?: boolean;
    };
  };

  public ngOnInit(): void {}
}
