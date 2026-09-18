import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TablePaginateComponent } from '@shared/components/table-paginate/table-paginate.component';
import { Router } from '@angular/router';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { HeaderTable, MenuItems } from '@shared/interface/header-table.interface';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ActivityFormatService } from '@modules/activity-format/service/activity-format.service';
import { PageEvent } from '@angular/material/paginator';
import {
  FormatoActividadPaginateResponse,
  FormatoActividadResponse,
  FormatoActividadResponseTable,
} from '@modules/activity-format/interface/activity-format';
import { finalize } from 'rxjs';
import { MENU_ACTIONS_ITEM } from '@shared/const/menu-acciones.const';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'app-list-activity-format',
  imports: [MatButton, TablePaginateComponent],
  templateUrl: './list-activity-format.html',
  styleUrl: './list-activity-format.scss',
})
export class ListActivityFormat implements OnInit {
  private readonly activityFormatService: ActivityFormatService = inject(ActivityFormatService);
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
  public dataSourceFormatoActividades: FormatoActividadResponseTable[] = [];

  public headers: HeaderTable[] = [
    { id: 'descripcionTipoActividad', label: 'Tipo de actividad', datatype: 'string' },
    { id: 'tema', label: 'Tema', datatype: 'string' },
    { id: 'serie', label: 'Serie', datatype: 'string' },
    { id: 'opciones', label: 'Opciones', datatype: 'options-butons' },
  ];

  ngOnInit(): void {
    this.setPageData();
    this.paginar();
  }

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([{ name: 'Formato de actividad', path: currentPath }]);
  }

  public paginar() {
    this.dataSourceFormatoActividades = [];
    this.loading = true;
    this.activityFormatService
      .listar(this.paginationData.pageIndex, this.paginationData.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: FormatoActividadPaginateResponse) => {
          const mappedRows: FormatoActividadResponseTable[] = this.rowMapActivityFormat(
            response.formatosActividades,
          );
          if (mappedRows?.length > 0) {
            this.dataSourceFormatoActividades = mappedRows;
          }
          this.paginationData.length = response.totalElementos;
          this.paginationData.pageIndex = response.numeroPagina;
        },
        error: () => {
          this.dataSourceFormatoActividades = [];
        },
      });
  }

  private rowMapActivityFormat(datos: FormatoActividadResponse[]): FormatoActividadResponseTable[] {
    return datos?.map((item: FormatoActividadResponse) => {
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

  protected onOptionSelect($event: {
    menuItem: MenuItems;
    element: FormatoActividadResponseTable;
  }) {
    switch ($event.menuItem.id) {
      case MENU_ACTIONS_ITEM.EDIT.id:
        this.redirectToEditActivityFormat($event.element);
        break;
      case MENU_ACTIONS_ITEM.DELETE.id:
        this.confirmDeleteActivityFormat($event.element);
        break;
    }
  }

  protected redirectToAddActivityFormat() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.router.navigate([currentPath + '/nuevo']).then();
  }

  private redirectToEditActivityFormat(element: FormatoActividadResponseTable) {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.router.navigate([`${currentPath}/${element.codigoFormatoActividad}`]).then();
  }

  private confirmDeleteActivityFormat(element: FormatoActividadResponseTable) {
    this.dialogService
      .openDialogConfirmacion(
        `Eliminar formato de actividad`,
        `¿Está seguro de eliminar el formato de actividad para este tipo de actividad: ${element.descripcionTipoActividad}?`,
      )
      .subscribe((response: boolean) => {
        if (response) {
          this.deleteActivityFormat(element);
        }
      });
  }

  private deleteActivityFormat(element: FormatoActividadResponseTable) {
    this.dialogService.openLoadingWindow();
    const codigoFormatoActividad = element.codigoFormatoActividad;
    this.activityFormatService
      .eliminar(codigoFormatoActividad)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.paginar();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar('Formato de actividad eliminado correctamente');
        },
      });
  }
}
