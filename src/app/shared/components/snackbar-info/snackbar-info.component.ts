import { Component, Inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { Snackbar } from '@shared/interface/snackbar.interface';

@Component({
  selector: 'app-snackbar-info',
  imports: [MatIcon],
  templateUrl: './snackbar-info.component.html',
  styleUrls: ['./snackbar-info.component.scss'],
})
export class SnackbarInfoComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: Snackbar) {}
}
