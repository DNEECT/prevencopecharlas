import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { TablePaginateComponent } from '@shared/components/table-paginate/table-paginate.component';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { Router } from '@angular/router';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { PageEvent } from '@angular/material/paginator';
import { HeaderTable } from '@shared/interface/header-table.interface';
import { finalize } from 'rxjs';
import { PermissionService } from '../../service/permission.service';
import { AccionesResponse, PermisosForm, PermisosResponse } from '../../interface/permission';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RoleService } from '../../../user/service/role.service';
import { ActionsService } from '../../service/actions.service';
import { FormFieldAutoCompleteComponent } from '@shared/components/form-field-auto-complete/form-field-auto-complete.component';

@Component({
  selector: 'app-list-permission',
  imports: [TablePaginateComponent, FormFieldAutoCompleteComponent],
  templateUrl: './list-permission.html',
  styleUrl: './list-permission.scss',
})
export class ListPermission implements OnInit {
  private readonly permissionService: PermissionService = inject(PermissionService);
  private readonly rolService: RoleService = inject(RoleService);
  private readonly actionsService: ActionsService = inject(ActionsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly router: Router = inject(Router);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  public paginationData: PageEvent = {
    pageSize: 5,
    pageIndex: 0,
    length: 100,
  };

  public loading: boolean = false;
  public dataSourcePermisosAll: PermisosResponse[] = [];

  public rolesSelect: AutoCompleteData[] = [];

  public headers: HeaderTable[] = [
    { id: 'nombreModulo', label: 'Nombre Modulo', datatype: 'string' },
  ];

  public rolModuloForm: FormGroup<PermisosForm> = new FormGroup<PermisosForm>({
    rol: new FormControl<AutoCompleteData | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.setPageData();
    this.cargarAcciones();
    this.getRoles();
  }

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([{ name: 'Permisos', path: currentPath }]);
  }

  public cargarAcciones(): void {
    this.dialogService.openLoadingWindow();
    this.actionsService
      .select()
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: AccionesResponse[]) => {
          const permisos: HeaderTable[] = response.map((accion) => {
            return {
              label: accion.descripcion,
              datatype: 'permisos',
              id: accion.codigoAccion,
              campoObjeto: 'permisos',
              campoArray: 'permisos',
            };
          });
          this.headers = [...this.headers, ...permisos];
        },
      });
  }

  public getRoles(): void {
    this.rolService
      .select()
      .pipe(
        finalize(() => {
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: AutoCompleteData[]) => {
          this.rolesSelect = response;
        },
      });
  }

  getPermisos($event: AutoCompleteData) {
    if (!$event) {
      this.dataSourcePermisosAll = [];
      return;
    }

    this.dialogService.openLoadingWindow();
    this.permissionService
      .select($event.key)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.dataSourcePermisosAll = response.filter(
            (permiso) => permiso.nombreModulo !== 'Todos',
          );
          this.paginationData.length = response.length;
        },
      });
  }
}
