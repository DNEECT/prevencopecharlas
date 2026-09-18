import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FormActivityFormat } from '@modules/activity-format/components/form-activity-format/form-activity-format';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { Router } from '@angular/router';
import { ActivityFormatService } from '@modules/activity-format/service/activity-format.service';
import { FormGroup } from '@angular/forms';
import {
  convertirFormatoActividadFormDtoToFormatoActividadRequest,
  errorMessagesFormatoActividadForm,
  FormatoActividadForm,
  formatoActividadFormGroup,
  FormatoActividadRequest,
} from '@modules/activity-format/interface/activity-format';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-add-activity-format',
  imports: [MatButton, FormActivityFormat],
  templateUrl: './add-activity-format.html',
  styleUrl: './add-activity-format.scss',
})
export class AddActivityFormat implements OnInit, OnDestroy {
  private readonly activityFormatService: ActivityFormatService = inject(ActivityFormatService);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);

  public activityFormatForm: FormGroup<FormatoActividadForm> = formatoActividadFormGroup;
  public errorMessagesForm: ErrorFields = errorMessagesFormatoActividadForm;

  ngOnInit(): void {
    this.setPageData();
  }

  ngOnDestroy(): void {
    this.activityFormatForm.reset();
  }

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([
      { name: 'Formato de actividad', path: parentPath },
      { name: 'Nuevo', path: currentPath },
    ]);
  }

  public createActivityFormat() {
    this.dialogService.openLoadingWindow();
    const request: FormatoActividadRequest =
      convertirFormatoActividadFormDtoToFormatoActividadRequest(this.activityFormatForm);
    this.activityFormatService
      .crear(request)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar('Formato de actividad creado correctamente');
          this.cancelActivityFormat();
        },
      });
  }

  public cancelActivityFormat() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.router.navigate([parentPath]).then();
  }
}
