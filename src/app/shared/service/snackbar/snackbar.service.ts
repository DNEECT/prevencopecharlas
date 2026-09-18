import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarInfoComponent } from '@shared/components/snackbar-info/snackbar-info.component';
import { Snackbar } from '@shared/interface/snackbar.interface';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);

  public openSuccessSnackBar(message: string, time: number = 5) {
    this.openSnackBar({ message, color: '#67b930', icon: 'check_circle_outline' }, time);
  }

  public openErrorSnackBar(message: string, time: number = 5) {
    this.openSnackBar({ message, color: '#db4437', icon: 'error_outline' }, time);
  }

  public openWarningSnackBar(message: string, time: number = 5) {
    this.openSnackBar({ message, color: '#f5a623', icon: 'info_outline' }, time);
  }

  private openSnackBar(data: Snackbar, time: number = 5) {
    this.snackBar.openFromComponent(SnackbarInfoComponent, {
      duration: time * 1000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: 'snackbar',
      data,
    });
  }
}
