import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { set, get } from 'lodash';

@Component({
  selector: 'field-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent implements OnInit {
  @Input()
  public formGroup?: FormGroup;

  @Input()
  public item?: {
    key: string;
    value: {
      type: string;
      label: string;
      options: (string | { name: string; value: string })[];
      disableLabelAppend?: boolean;
    };
  };

  public ngOnInit(): void {
    this.rebuildOptions();
  }

  public get isShowName() {
    return !!get(this.item, 'value.options[0].name');
  }

  public rebuildOptions() {
    const options = this.item?.value?.options || [];

    set(
      this.item || {},
      'value.options',
      options.map((o) => {
        if (typeof o === 'string') {
          return {
            name: o,
            value: o,
          };
        }
        return o;
      })
    );
  }
}
