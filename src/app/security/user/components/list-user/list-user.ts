import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TablePaginateComponent } from '@shared/components/table-paginate/table-paginate.component';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { Router } from '@angular/router';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { PageEvent } from '@angular/material/paginator';
import { HeaderTable, MenuItems } from '@shared/interface/header-table.interface';
import { finalize } from 'rxjs';
import { MENU_ACTIONS_ITEM } from '@shared/const/menu-acciones.const';
import { Sort } from '@angular/material/sort';
import { UserService } from '../../service/user.service';
import {
  UsuarioPaginateResponse,
  UsuarioResponse,
  UsuarioResponseTable,
} from '../../interface/user';
import { FormControl, FormGroup } from '@angular/forms';
import { FormFieldInputComponent } from '@shared/components/form-field-input/form-field-input.component';

@Component({
  selector: 'app-list-user',
  imports: [MatButton, TablePaginateComponent, FormFieldInputComponent],
  templateUrl: './list-user.html',
  styleUrl: './list-user.scss',
})
export class ListUser implements OnInit {
  private readonly userService: UserService = inject(UserService);
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
  public dataSourceUser: UsuarioResponseTable[] = [];

  public formFilter = new FormGroup({
    terminoBusqueda: new FormControl<string | null>(null),
  });

  public headers: HeaderTable[] = [
    { id: 'numeroDocumento', label: 'Numero Documento', datatype: 'string' },
    { id: 'nombres', label: 'Nombres', datatype: 'string' },
    { id: 'apellidos', label: 'Apellidos', datatype: 'string' },
    { id: 'username', label: 'Nombre Usuario', datatype: 'string' },
    { id: 'direccion', label: 'Dirección', datatype: 'string', maxwidth: '200px' },
    { id: 'roles', label: 'Roles', datatype: 'array-objeto', campoArrayObjeto: 'nombre' },
    { id: 'estado', label: 'Estado', datatype: 'estado' },
    { id: 'opciones', label: 'Opciones', datatype: 'options-butons' },
  ];

  ngOnInit(): void {
    this.setPageData();
    this.paginar();
  }

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([{ name: 'Usuario', path: currentPath }]);
  }

  public paginar() {
    this.dataSourceUser = [];
    this.loading = true;
    this.userService
      .listar(this.paginationData.pageIndex, this.paginationData.pageSize, this.formFilter.value.terminoBusqueda)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: UsuarioPaginateResponse) => {
          const mappedRows: UsuarioResponseTable[] = this.rowMapUser(response.usuarios);
          if (mappedRows?.length > 0) {
            this.dataSourceUser = mappedRows;
          }
          this.paginationData.length = response.totalElementos;
          this.paginationData.pageIndex = response.numeroPagina;
        },
        error: () => {
          this.dataSourceUser = [];
        },
      });
  }

  private rowMapUser(datos: UsuarioResponse[]): UsuarioResponseTable[] {
    return datos?.map((item: UsuarioResponse) => {
      const options: MenuItems[] = [];
      options.push(MENU_ACTIONS_ITEM.EDIT);
      if (item.estado) {
        options.push(MENU_ACTIONS_ITEM.INACTIVE);
      } else {
        options.push(MENU_ACTIONS_ITEM.ACTIVE);
      }
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

  protected onOptionSelect($event: { menuItem: MenuItems; element: UsuarioResponseTable }) {
    switch ($event.menuItem.id) {
      case MENU_ACTIONS_ITEM.EDIT.id:
        this.redirectToEditUser($event.element);
        break;
      case MENU_ACTIONS_ITEM.ACTIVE.id:
        this.confirmDeleteUser($event.element);
        break;
      case MENU_ACTIONS_ITEM.INACTIVE.id:
        this.confirmDeleteUser($event.element);
        break;
    }
  }

  protected redirectToAddUser() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.router.navigate([currentPath + '/nuevo']).then();
  }

  private redirectToEditUser(element: UsuarioResponseTable) {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.router.navigate([`${currentPath}/${element.codigoUsuario}`]).then();
  }

  private confirmDeleteUser(element: UsuarioResponseTable) {
    this.dialogService
      .openDialogConfirmacion(
        element.estado ? 'Desactivar' : 'Activar' + ' usuario',
        `¿Está seguro de ${element.estado ? 'desactivar' : 'activar'} el usuario: ${element.nombres}?`,
      )
      .subscribe((response: boolean) => {
        if (response) {
          this.deleteUser(element);
        }
      });
  }

  private deleteUser(element: UsuarioResponseTable) {
    this.dialogService.openLoadingWindow();
    const codigoUsuario = element.codigoUsuario;
    this.userService
      .eliminar(codigoUsuario)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.paginar();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar('Usuario eliminado correctamente');
        },
      });
  }
}
