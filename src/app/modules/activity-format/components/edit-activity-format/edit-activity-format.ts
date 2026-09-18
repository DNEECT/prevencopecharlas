import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { ActivityFormatService } from '@modules/activity-format/service/activity-format.service';
import {
  convertirFormatoActividadFormDtoToFormatoActividadRequest,
  convertirFormatoActividadResponseToFormatoActividadFormDto,
  errorMessagesFormatoActividadForm,
  FormatoActividadForm,
  formatoActividadFormGroup,
  FormatoActividadRequest,
  FormatoActividadResponse,
} from '@modules/activity-format/interface/activity-format';
import { finalize } from 'rxjs';
import { FormActivityFormat } from '@modules/activity-format/components/form-activity-format/form-activity-format';

@Component({
  selector: 'app-edit-activity-format',
  imports: [MatButton, FormActivityFormat],
  templateUrl: './edit-activity-format.html',
  styleUrl: './edit-activity-format.scss',
})
export class EditActivityFormat implements OnInit, OnDestroy {
  private readonly activityFormatService: ActivityFormatService = inject(ActivityFormatService);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  public activityFormatForm: FormGroup<FormatoActividadForm> = formatoActividadFormGroup;
  public errorMessagesForm: ErrorFields = errorMessagesFormatoActividadForm;

  private codigoFormatoActividad: string = '';

  ngOnInit(): void {
    this.setPageData();
    this.route.data.subscribe((data) => {
      const formatoActividad = data['formatoActividad'] as FormatoActividadResponse | null;
      if (formatoActividad) {
        this.codigoFormatoActividad = formatoActividad.codigoFormatoActividad;
        this.activityFormatForm.patchValue(
          convertirFormatoActividadResponseToFormatoActividadFormDto(formatoActividad),
        );
      }
    });
  }
  ngOnDestroy(): void {}

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([
      { name: 'Formato de actividad', path: parentPath },
      { name: 'Editar', path: currentPath },
    ]);
  }

  public updateActivityFormat() {
    this.dialogService.openLoadingWindow();
    const request: FormatoActividadRequest =
      convertirFormatoActividadFormDtoToFormatoActividadRequest(this.activityFormatForm);
    this.activityFormatService
      .actualizar(request, this.codigoFormatoActividad)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar(
            'Formato de actividad actualizado correctamente',
          );
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
