import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'field-advanced-select',
  templateUrl: './advanced-select.component.html',
  styleUrls: ['./advanced-select.component.scss'],
})
export class AdvancedSelectComponent implements OnInit {
  @Input()
  public formGroup?: FormGroup;

  @Input()
  public item?: {
    key: string;
    value: {
      type: string;
      label: string;
      options: string[] | { name: string; value: string }[];
      advancedSelectType?: string;
      disableLabelAppend?: boolean;
      placeholder?: string;
    };
  };

  public ngOnInit(): void {}

  public get isShowPlaceholder() {
    if (!this.item) {
      return true;
    }

    const value = this.formGroup?.get(this.item.key)?.value;

    if (!value) {
      return true;
    }

    if (Array.isArray(value)) {
      return !value.length;
    }

    return !value;
  }
}
