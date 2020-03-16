import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'field-simple-object',
  templateUrl: './simple-object.component.html',
  styleUrls: ['./simple-object.component.scss'],
})
export class SimpleObjectComponent implements OnInit {
  @Input()
  public formGroup?: FormGroup;

  @Input()
  public item?: {
    key: string;
    value: {
      type: string;
      label: string;
      placeholders?: string[];
      disableLabelAppend?: boolean;
    };
  };

  public inputKey = '';

  public inputValue = '';

  public ngOnInit(): void {}

  public get objectFormGroup() {
    if (!this.item) {
      return null;
    }
    return this.formGroup?.get(this.item.key) as FormGroup | null;
  }

  public get data() {
    return this.objectFormGroup?.value;
  }

  public get placeholders() {
    return this.item?.value?.placeholders || [];
  }

  public add() {
    if (!this.inputKey || !this.inputValue) {
      return;
    }

    if (!this.objectFormGroup) {
      return;
    }

    const old = this.objectFormGroup.value;

    if (old[this.inputKey]) {
      this.objectFormGroup.patchValue({
        [this.inputKey]: this.inputValue,
      });
    } else {
      this.objectFormGroup.addControl(this.inputKey, new FormControl(this.inputValue));
    }

    this.inputKey = '';
    this.inputValue = '';
  }

  public remove(key: string) {
    if (!this.objectFormGroup) {
      return;
    }

    this.objectFormGroup.removeControl(key);
  }
}
