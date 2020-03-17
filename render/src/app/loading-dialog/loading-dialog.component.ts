import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-loading-dialog',
  templateUrl: './loading-dialog.component.html',
  styleUrls: ['./loading-dialog.component.scss'],
})
export class LoadingDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { config?: { message?: string } }) {}

  public ngOnInit(): void {}
}
