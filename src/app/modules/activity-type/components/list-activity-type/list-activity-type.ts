import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { TablePaginateComponent } from '@shared/components/table-paginate/table-paginate.component';
import { HeaderTable, MenuItems } from '@shared/interface/header-table.interface';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import {
  TipoActividadPaginateResponse,
  TipoActividadResponse,
  TipoActividadResponseTable,
} from '@modules/activity-type/interface/activity-type';
import { ActivityTypeService } from '@modules/activity-type/service/activity-type.service';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { MENU_ACTIONS_ITEM } from '@shared/const/menu-acciones.const';
import { Sort } from '@angular/material/sort';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';

@Component({
  selector: 'app-list-activity-type',
  imports: [TablePaginateComponent, MatButton],
  templateUrl: './list-activity-type.html',
  styleUrl: './list-activity-type.scss',
})
export class ListActivityType implements OnInit {
  private readonly activityTypeService: ActivityTypeService = inject(ActivityTypeService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly router: Router = inject(Router);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  public paginationData: PageEvent = {
    pageSize: 5,
    pageIndex: 0,
    length: 0,
  };

  public loading: boolean = false;
  public dataSourceTipoActividades: TipoActividadResponseTable[] = [];

  public headers: HeaderTable[] = [
    { id: 'nombre', label: 'Nombre', datatype: 'string' },
    { id: 'descripcion', label: 'Descripcion', datatype: 'string' },
    { id: 'opciones', label: 'Opciones', datatype: 'options-butons' },
  ];

  ngOnInit(): void {
    this.setPageData();
    this.paginar();
  }

  public paginar() {
    this.dataSourceTipoActividades = [];
    this.loading = true;
    this.activityTypeService
      .listar(this.paginationData.pageIndex, this.paginationData.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: TipoActividadPaginateResponse) => {
          const mappedRows: TipoActividadResponseTable[] = this.rowMapActivityType(
            response.tiposActividades,
          );
          if (mappedRows?.length > 0) {
            this.dataSourceTipoActividades = mappedRows;
          }
          this.paginationData.length = response.totalElementos;
          this.paginationData.pageIndex = response.numeroPagina;
        },
        error: () => {
          this.dataSourceTipoActividades = [];
        },
      });
  }

  private rowMapActivityType(datos: TipoActividadResponse[]): TipoActividadResponseTable[] {
    return datos?.map((item: TipoActividadResponse) => {
      const options: MenuItems[] = [];
      options.push(MENU_ACTIONS_ITEM.EDIT);
      options.push(MENU_ACTIONS_ITEM.DELETE);
      return {
        ...item,
        opciones: options,
      };
    });
  }

  protected onPageChange($event: { pageEvent: PageEvent; sort: Sort | null }) {
    this.paginationData.pageIndex = $event.pageEvent.pageIndex;
    this.paginationData.pageSize = $event.pageEvent.pageSize;
    this.paginar();
  }

  protected onOptionSelect($event: { menuItem: MenuItems; element: TipoActividadResponseTable }) {
    switch ($event.menuItem.id) {
      case MENU_ACTIONS_ITEM.EDIT.id:
        this.redirectToEditActivityType($event.element);
        break;
      case MENU_ACTIONS_ITEM.DELETE.id:
        this.confirmDeleteActivityType($event.element);
        break;
    }
  }

  protected redirectToAddActivityType() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.router.navigate([currentPath + '/nuevo']).then();
  }

  private redirectToEditActivityType(element: TipoActividadResponseTable) {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.router.navigate([`${currentPath}/${element.codigoTipoActividad}`]).then();
  }

  private confirmDeleteActivityType(element: TipoActividadResponseTable) {
    this.dialogService
      .openDialogConfirmacion(
        `Eliminar tipo de actividad`,
        `¿Está seguro de eliminar el tipo de actividad ${element.nombre}?`,
      )
      .subscribe((response: boolean) => {
        if (response) {
          this.deleteActivityType(element);
        }
      });
  }

  private deleteActivityType(element: TipoActividadResponseTable) {
    this.dialogService.openLoadingWindow();
    const codigoTipoActividad = element.codigoTipoActividad;
    this.activityTypeService
      .eliminar(codigoTipoActividad)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.paginar();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar('Tipo de actividad eliminado correctamente');
        },
      });
  }

  private setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([{ name: 'Tipo de actividad', path: currentPath }]);
  }
}
