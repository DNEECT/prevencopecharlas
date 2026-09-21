import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TablePaginateComponent } from '@shared/components/table-paginate/table-paginate.component';
import { Router } from '@angular/router';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { HeaderTable, MenuItems } from '@shared/interface/header-table.interface';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ActivityRegisterService } from '@modules/activity-register/service/activity-register.service';
import { PageEvent } from '@angular/material/paginator';
import {
  RegistroActividadPaginateResponse,
  RegistroActividadParticipanteResponse,
  RegistroActividadResponse,
  RegistroActividadResponseTable,
} from '@modules/activity-register/interface/activity-register';
import { finalize, firstValueFrom } from 'rxjs';
import { MENU_ACTIONS_ITEM } from '@shared/const/menu-acciones.const';
import { Sort } from '@angular/material/sort';
import { ExcelService } from '@shared/service/excel/excel.service';
import { FormControl, FormGroup } from '@angular/forms';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { SpecialnationaljuryService } from '@modules/activity-register/service/specialnationaljury.service';
import { FormFieldAutoCompleteComponent } from '@shared/components/form-field-auto-complete/form-field-auto-complete.component';
import { FormFieldInputComponent } from '@shared/components/form-field-input/form-field-input.component';

@Component({
  selector: 'app-list-activity-register',
  imports: [
    TablePaginateComponent,
    MatButton,
    FormFieldAutoCompleteComponent,
    FormFieldInputComponent,
  ],
  templateUrl: './list-activity-register.html',
  styleUrl: './list-activity-register.scss',
})
class ListActivityRegister implements OnInit {
  private readonly activityRegisterService: ActivityRegisterService =
    inject(ActivityRegisterService);
  private readonly specialNationalJuryService: SpecialnationaljuryService = inject(
    SpecialnationaljuryService,
  );
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly router: Router = inject(Router);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly excelService: ExcelService = inject(ExcelService);

  public paginationData: PageEvent = {
    pageSize: 5,
    pageIndex: 0,
    length: 0,
  };

  public loading: boolean = false;
  public dataSourceRegistroActividades: RegistroActividadResponseTable[] = [];

  protected listjuradoNacionalEspecial: AutoCompleteData[] = [];

  public formFilter = new FormGroup({
    juradoNacionalEspecial: new FormControl<AutoCompleteData | null>(null),
    terminoBusqueda: new FormControl<string | null>(null),
  });

  public headers: HeaderTable[] = [
    { id: 'codigo', label: 'Codigo', datatype: 'string' },
    { id: 'nombreProcesoElectoral', label: 'Proceso Electoral', datatype: 'string' },
    { id: 'nombreJuradoNacionalEspecial', label: 'Jurado Electoral Especial', datatype: 'string' },
    { id: 'nombreTipoActividad', label: 'Tipo de actividad', datatype: 'string' },
    { id: 'lugar', label: 'Lugar', datatype: 'string' },
    { id: 'fecha', label: 'Fecha', datatype: 'date' },
    { id: 'nombreTipoAsistente', label: 'Tipo de asistentes', datatype: 'string' },
    { id: 'tema', label: 'Tema', datatype: 'string', maxwidth: '300px' },
    { id: 'cantidadParticipantes', label: 'Participantes', datatype: 'number' },
    { id: 'opciones', label: 'Opciones', datatype: 'options-butons' },
  ];

  ngOnInit(): void {
    this.setPageData();
    this.paginar();
    this.selectSpecialNationalJury();
  }

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([{ name: 'Registro de actividad', path: currentPath }]);
  }

  public paginar() {
    this.dataSourceRegistroActividades = [];
    this.loading = true;
    this.activityRegisterService
      .listar(
        this.paginationData.pageIndex,
        this.paginationData.pageSize,
        this.formFilter.value.juradoNacionalEspecial?.key,
        this.formFilter.value.terminoBusqueda,
      )
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: RegistroActividadPaginateResponse) => {
          const mappedRows: RegistroActividadResponseTable[] = this.rowMapActivityRegister(
            response.registroActividades,
          );
          if (mappedRows?.length > 0) {
            this.dataSourceRegistroActividades = mappedRows;
          }
          this.paginationData.length = response.totalElementos;
          this.paginationData.pageIndex = response.numeroPagina;
        },
        error: () => {
          this.dataSourceRegistroActividades = [];
        },
      });
  }

  public selectSpecialNationalJury() {
    this.listjuradoNacionalEspecial = [];
    this.specialNationalJuryService
      .select()
      .pipe(
        finalize(() => {
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: AutoCompleteData[]) => {
          this.listjuradoNacionalEspecial = response;
        },
        error: () => {
          this.listjuradoNacionalEspecial = [];
        },
      });
  }

  private rowMapActivityRegister(
    datos: RegistroActividadResponse[],
  ): RegistroActividadResponseTable[] {
    return datos?.map((item: RegistroActividadResponse) => {
      const options: MenuItems[] = [];
      options.push(MENU_ACTIONS_ITEM.EDIT);
      options.push(MENU_ACTIONS_ITEM.DELETE);
      options.push(MENU_ACTIONS_ITEM.EXPORT);
      return {
        ...item,
        opciones: options,
        cantidadParticipantes: item.cantidadParticipantes ?? item.participantes?.length ?? 0,
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
    element: RegistroActividadResponseTable;
  }) {
    switch ($event.menuItem.id) {
      case MENU_ACTIONS_ITEM.EDIT.id:
        this.redirectToEditActivityRegister($event.element);
        break;
      case MENU_ACTIONS_ITEM.DELETE.id:
        this.confirmDeleteActivityRegistr($event.element);
        break;
      case MENU_ACTIONS_ITEM.EXPORT.id:
        this.exportRegistroConParticipantes($event.element).then();
        break;
    }
  }

  protected redirectToAddRegisterActivity() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.router.navigate([currentPath + '/nuevo']).then();
  }

  private redirectToEditActivityRegister(element: RegistroActividadResponseTable) {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    this.router.navigate([`${currentPath}/${element.codigoRegistroActividad}`]).then();
  }

  private confirmDeleteActivityRegistr(element: RegistroActividadResponseTable) {
    this.dialogService
      .openDialogConfirmacion(
        `Eliminar registro de actividad`,
        `¿Está seguro de eliminar el registro de actividad para este tipo de actividad: ${element.nombreTipoActividad}?`,
      )
      .subscribe((response: boolean) => {
        if (response) {
          this.deleteActivityFormat(element);
        }
      });
  }

  private deleteActivityFormat(element: RegistroActividadResponseTable) {
    this.dialogService.openLoadingWindow();
    const codigoRegistroActividad = element.codigoRegistroActividad;
    this.activityRegisterService
      .eliminar(codigoRegistroActividad)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.paginar();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar('Registro de actividad eliminado correctamente');
        },
      });
  }

  public async exportRegistroConParticipantes(registro: RegistroActividadResponse): Promise<void> {
    registro = await firstValueFrom(this.activityRegisterService.obtener(registro.codigoRegistroActividad));
    const details = {
      Código: registro.codigo,
      Proceso: registro.nombreProcesoElectoral,
      'Tipo actividad (nombre)': registro.nombreTipoActividad,
      Lugar: registro.lugar,
      Tema: registro.tema,
      Fecha: registro.fecha,
      Hora: registro.hora,
      Observaciones: registro.observaciones ?? '',
    };

    const participantesTable = (registro.participantes ?? []).map(
      (item: RegistroActividadParticipanteResponse) => {
        const isIndigena = item.poblacion === 'Indígena';
        const isDiscapacitado = item.poblacion === 'Personas con discapacidad';
        const isAfroPeruano = item.poblacion === 'Afro-Peruana';
        return {
          DNI: item.dni,
          'Nombres completos': item.nombresCompletos,
          Sexo: item.sexo,
          Edad: item.edad,
          Organización: item.organizacion,
          Cargo: item.cargo,
          Teléfono: item.telefono,
          Correo: item.correo,
          Indígena: isIndigena,
          Discapacitado: isDiscapacitado,
          'Afro-Peruano': isAfroPeruano,
        };
      },
    );

    const fileName = `Registro_${registro.codigo ?? new Date().toISOString().slice(0, 10)}`;

    await this.excelService.exportSheetWithDetailsAndTable({
      sheetName: 'Registro y Participantes',
      details,
      tableHeaders: Object.keys(participantesTable[0] ?? {}),
      tableRows: participantesTable,
      fileName,
    });
  }

  public exportRegistros() {
    this.dialogService.openLoadingWindow();
    this.activityRegisterService
      .listar(
        null,
        null,
        this.formFilter.value.juradoNacionalEspecial?.key,
        this.formFilter.value.terminoBusqueda,
      )
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: RegistroActividadPaginateResponse) => {
          const mappedRows: RegistroActividadResponseTable[] = this.rowMapActivityRegister(
            response.registroActividades,
          );
          this.exportRegistro(mappedRows).then();
        },
      });
  }

  public async exportRegistro(registros: RegistroActividadResponseTable[]): Promise<void> {
    const fileName = `Registros_${new Date().toISOString().slice(0, 10)}`;
    const rows = registros.map((registro) => ({
      Código: registro.codigo,
      Proceso: registro.nombreProcesoElectoral,
      'Tipo actividad (nombre)': registro.nombreTipoActividad,
      'Jurado Nacional Especial': registro.nombreJuradoNacionalEspecial,
      'Tipo de asistentes': registro.nombreTipoAsistente,
      'Publico Objetivo ': registro.nombrePublicoObjetivo,
      Lugar: registro.lugar,
      Tema: registro.tema,
      Fecha: registro.fecha,
      Hora: registro.hora,
      Recomendaciones: registro.recomendaciones,
      Observaciones: registro.observaciones ?? '',
      'Cantidad de participantes': registro.cantidadParticipantes,
    }));
    this.excelService.jsonToExcel(rows, fileName).then();
  }
}

export default ListActivityRegister;
