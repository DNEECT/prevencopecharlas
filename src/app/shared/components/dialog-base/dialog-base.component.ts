import { NgClass } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { DialogDataDto } from '@shared/interface/dialog.interface';

@Component({
  selector: 'app-dialog-base',
  imports: [MatDialogActions, NgClass, MatDialogClose, MatIcon],
  templateUrl: './dialog-base.component.html',
  styleUrls: ['./dialog-base.component.scss'],
})
export class DialogBaseComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogDataDto) {}
}
