import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { fromPairs, toPairs } from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class FormGroupGenerateService {
  constructor(private fb: FormBuilder) {}

  public append(
    result: { [key: string]: any },
    schema: object,
    defined: { [key: string]: any } = {}
  ) {
    /* eslint-disable no-param-reassign */
    Object.entries(schema).forEach(([key, item]: [string, any]) => {
      if (item.type === 'simple-object') {
        result[key] = this.fb.group(
          fromPairs([
            ...toPairs(item.default || {}).map(([itemKey, value]) => {
              return [itemKey, [value, Validators.required]];
            }),
            ...toPairs(defined[key] || {}).map(([itemKey, value]) => {
              return [itemKey, [value, Validators.required]];
            }),
          ])
        );
      } else {
        result[key] = [
          defined[key] || item.default,
          item.required === false ? undefined : Validators.required,
        ];
      }
    });
  }

  public loadGroup(data?: any, configSchema?: any[]) {
    const o = {} as any;
    configSchema?.forEach(({ items }) => {
      this.append(o, items, data);
    });

    return this.fb.group(o);
  }
}
