import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { LoadingDialogComponent } from './loading-dialog.component';

@NgModule({
  declarations: [LoadingDialogComponent],
  entryComponents: [LoadingDialogComponent],
  imports: [CommonModule],
})
export class LoadingDialogModule {}
