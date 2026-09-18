import { NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { DialogUpload } from '@shared/interface/dialog.interface';
import { ExcelService } from '@shared/service/excel/excel.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';

@Component({
  selector: 'app-dialog-upload',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    NgIf,
    MatIconButton,
    MatIcon,
  ],
  templateUrl: './dialog-upload.component.html',
  styleUrl: './dialog-upload.component.scss',
})
export class DialogUploadComponent {
  public selectedFile: File | null = null;

  constructor(
    public dialogRef: MatDialogRef<DialogUploadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogUpload,
    private readonly excelService: ExcelService,
    private readonly snackbarService: SnackbarService,
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async onUpload(): Promise<void> {
    if (this.selectedFile) {
      try {
        const arrayData = await this.excelService.excelToJson(this.selectedFile);
        this.dialogRef.close(arrayData);
      } catch (error) {
        this.snackbarService.openErrorSnackBar('Error al cargar el archivo');
        this.dialogRef.close(null);
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onClear() {
    this.selectedFile = null;
  }
}
