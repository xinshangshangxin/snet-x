import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { ElectronService } from '../../../core/services/electron.service';
import { SSConfig, SsUrlDecodeService } from '../../../core/services/ss-url-decode.service';

export interface DialogData {
  url?: string;
  showCount?: number;
  multiple?: boolean;
}

@Component({
  selector: 'app-ss-import',
  templateUrl: './ss-import.component.html',
  styleUrls: ['./ss-import.component.scss'],
})
export class SsImportComponent implements OnInit {
  public inputValue = '';

  public dataSource?: MatTableDataSource<SSConfig>;

  public displayedColumns = ['select', 'remarks', 'server', 'port', 'method', 'password'];

  public selection = new SelectionModel<SSConfig>(false);

  constructor(
    public dialogRef: MatDialogRef<SsImportComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: DialogData
  ) {}

  public ngOnInit(): void {
    const str = this.data?.url || ElectronService.readText();

    if (str && /^\s*ssr?:\/\//.test(str)) {
      this.inputValue = str;
      this.decode();
    }
  }

  public decode() {
    console.info('decode: ', this.inputValue);
    if (!this.inputValue) {
      return;
    }

    const list = SsUrlDecodeService.decode(this.inputValue, true);

    this.dataSource = new MatTableDataSource(list.slice(0, this.data?.showCount));
    this.selection = new SelectionModel<SSConfig>(this.data?.multiple, []);

    if (!this.isAllSelected()) {
      this.masterToggle();
    }
  }

  public isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource?.data.length;
    return numSelected === numRows;
  }

  public masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource?.data.forEach((row) => this.selection.select(row));
    }
  }
}
