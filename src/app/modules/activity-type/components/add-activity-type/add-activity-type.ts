import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormActivityType } from '@modules/activity-type/components/form-activity-type/form-activity-type';
import { MatButton } from '@angular/material/button';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import {
  convertirTipoActividadFormDtoToTipoActividadRequest,
  errorMessagesTipoActividadForm,
  TipoActividadForm,
  tipoActividadFormGroup,
  TipoActividadRequest,
} from '@modules/activity-type/interface/activity-type';
import { FormGroup } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { ActivityTypeService } from '@modules/activity-type/service/activity-type.service';
import { finalize } from 'rxjs';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-activity-type',
  imports: [FormActivityType, MatButton],
  templateUrl: './add-activity-type.html',
  styleUrl: './add-activity-type.scss',
})
export class AddActivityType implements OnInit, OnDestroy {
  private readonly activityTypeService: ActivityTypeService = inject(ActivityTypeService);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);

  public tipoActividadForm: FormGroup<TipoActividadForm> = tipoActividadFormGroup;
  public errorMessagesForm: ErrorFields = errorMessagesTipoActividadForm;

  ngOnInit(): void {
    this.setPageData();
  }

  ngOnDestroy(): void {
    this.tipoActividadForm.reset();
  }

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([
      { name: 'Tipo de actividad', path: parentPath },
      { name: 'Nuevo', path: currentPath },
    ]);
  }

  public createTipoActividad() {
    this.dialogService.openLoadingWindow();
    const request: TipoActividadRequest = convertirTipoActividadFormDtoToTipoActividadRequest(
      this.tipoActividadForm,
    );
    this.activityTypeService
      .crear(request)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar('Tipo de actividad creado correctamente');
          this.cancelTipoActividad();
        },
      });
  }

  public cancelTipoActividad() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.router.navigate([parentPath]).then();
  }
}
