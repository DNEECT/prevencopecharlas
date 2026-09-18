import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DialogLoadingDto } from '@shared/interface/dialog.interface';

@Component({
  selector: 'app-dialog-loading',
  imports: [MatProgressSpinner],
  templateUrl: './dialog-loading.component.html',
  styleUrls: ['./dialog-loading.component.scss'],
})
export class DialogLoadingComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogLoadingDto) {}
}
