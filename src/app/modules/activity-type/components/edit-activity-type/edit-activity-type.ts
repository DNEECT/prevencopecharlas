import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormActivityType } from '@modules/activity-type/components/form-activity-type/form-activity-type';
import { MatButton } from '@angular/material/button';
import { ActivityTypeService } from '@modules/activity-type/service/activity-type.service';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import {
  convertirTipoActividadFormDtoToTipoActividadRequest,
  errorMessagesTipoActividadForm,
  TipoActividadForm,
  tipoActividadFormGroup,
  TipoActividadRequest,
  TipoActividadResponse,
} from '@modules/activity-type/interface/activity-type';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-edit-activity-type',
  imports: [FormActivityType, MatButton],
  templateUrl: './edit-activity-type.html',
  styleUrl: './edit-activity-type.scss',
})
export class EditActivityType implements OnInit, OnDestroy {
  private readonly activityTypeService: ActivityTypeService = inject(ActivityTypeService);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  public tipoActividadForm: FormGroup<TipoActividadForm> = tipoActividadFormGroup;
  public errorMessagesForm: ErrorFields = errorMessagesTipoActividadForm;

  private codigoTipoActividad: string = '';

  ngOnInit(): void {
    this.setPageData();
    this.route.data.subscribe((data) => {
      const tipoActividad = data['tipoActividad'] as TipoActividadResponse | null;
      if (tipoActividad) {
        this.codigoTipoActividad = tipoActividad.codigoTipoActividad;
        this.tipoActividadForm.patchValue(tipoActividad);
      }
    });
  }

  ngOnDestroy(): void {}

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([
      { name: 'Tipo de actividad', path: parentPath },
      { name: 'Editar', path: currentPath },
    ]);
  }

  public updateTipoActividad() {
    this.dialogService.openLoadingWindow();
    const request: TipoActividadRequest = convertirTipoActividadFormDtoToTipoActividadRequest(
      this.tipoActividadForm,
    );
    this.activityTypeService
      .actualizar(request, this.codigoTipoActividad)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar('Tipo de actividad actualizado correctamente');
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
