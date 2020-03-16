import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'field-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.scss'],
})
export class PasswordComponent implements OnInit {
  @Input()
  public formGroup?: FormGroup;

  @Input()
  public item?: {
    key: string;
    value: {
      type: string;
      label: string;
      disableLabelAppend?: boolean;
      showPassword?: boolean;
    };
  };

  public ngOnInit(): void {}
}
