import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import ListActivityRegister from './list-activity-register';
import { Router } from '@angular/router';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ActivityRegisterService } from '@modules/activity-register/service/activity-register.service';
import { of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { MENU_ACTIONS_ITEM } from '@shared/const/menu-acciones.const';
import { ExcelService } from '@shared/service/excel/excel.service';
import { ElectoralprocessService } from '@modules/activity-register/service/electoralprocess.service';
import { SpecialnationaljuryService } from '@modules/activity-register/service/specialnationaljury.service';

const registroMock = {
  codigo: 'COD-1',
  codigoRegistroActividad: 'REG-1',
  nombreProcesoElectoral: 'PE 2025',
  nombreTipoActividad: 'Capacitación',
  lugar: 'Lima',
  fecha: '2025-11-20',
  hora: '10:00',
  observaciones: 'Obs',
  tema: 'Tema X',
  participantes: [
    {
      dni: '123',
      nombresCompletos: 'Juan Perez',
      sexo: 'M',
      edad: 30,
      organizacion: 'Org',
      cargo: 'Cargo',
      telefono: '999',
      correo: 'a@b.com',
      poblacion: 'Indígena',
    },
    {
      dni: '456',
      nombresCompletos: 'Ana Lopez',
      sexo: 'F',
      edad: 28,
      organizacion: 'Org2',
      cargo: 'Cargo2',
      telefono: '888',
      correo: 'c@d.com',
      poblacion: 'Afro-Peruana',
    },
  ],
} as any;

const paginateResponse = {
  registroActividades: [registroMock],
  totalElementos: 1,
  numeroPagina: 0,
} as any;

class RouterStub {
  public url = '/modulo/registro-actividad';
  navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
}

class BreadcrumbsServiceStub {
  setRoot = jasmine.createSpy('setRoot');
  pushPath = jasmine.createSpy('pushPath');
}

class DialogServiceStub {
  openDialogConfirmacion = jasmine.createSpy('openDialogConfirmacion').and.returnValue(of(true));
  openLoadingWindow = jasmine.createSpy('openLoadingWindow');
  closeDialog = jasmine.createSpy('closeDialog');
}

class SnackbarServiceStub {
  openSuccessSnackBar = jasmine.createSpy('openSuccessSnackBar');
  openErrorSnackBar = jasmine.createSpy('openErrorSnackBar');
  openWarningSnackBar = jasmine.createSpy('openWarningSnackBar');
}

class ActivityRegisterServiceStub {
  listar = jasmine.createSpy('listar').and.returnValue(of(paginateResponse));
  listarTodos = jasmine.createSpy('listarTodos').and.returnValue(of([registroMock]));
  obtener = jasmine.createSpy('obtener').and.returnValue(of(registroMock));
  eliminar = jasmine.createSpy('eliminar').and.returnValue(of(void 0));
}

class ExcelServiceStub {
  jsonToExcel = jasmine.createSpy('jsonToExcel').and.returnValue(Promise.resolve());
  exportSheetWithDetailsAndTable = jasmine
    .createSpy('exportSheetWithDetailsAndTable')
    .and.returnValue(Promise.resolve());
}

class ElectoralprocessServiceStub {
  select = jasmine.createSpy('select').and.returnValue(
    of([
      { key: 'process-1', value: 'Proceso actual', isDefault: true },
      { key: 'process-2', value: 'Proceso histórico', isDefault: false },
    ]),
  );
  getActivityListDefault = jasmine.createSpy('getActivityListDefault').and.returnValue(null);
}

class SpecialnationaljuryServiceStub {
  select = jasmine.createSpy('select').and.returnValue(of([]));
}

describe('ListActivityRegister', () => {
  let component: ListActivityRegister;
  let fixture: ComponentFixture<ListActivityRegister>;
  let activityService: ActivityRegisterServiceStub;
  let router: RouterStub;
  let dialog: DialogServiceStub;
  let excel: ExcelServiceStub;
  let snackbar: SnackbarServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListActivityRegister],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useClass: RouterStub },
        { provide: BreadcrumbsService, useClass: BreadcrumbsServiceStub },
        { provide: DialogService, useClass: DialogServiceStub },
        { provide: SnackbarService, useClass: SnackbarServiceStub },
        { provide: ActivityRegisterService, useClass: ActivityRegisterServiceStub },
        { provide: ExcelService, useClass: ExcelServiceStub },
        { provide: ElectoralprocessService, useClass: ElectoralprocessServiceStub },
        { provide: SpecialnationaljuryService, useClass: SpecialnationaljuryServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListActivityRegister);
    component = fixture.componentInstance;
    activityService = TestBed.inject(ActivityRegisterService) as any;
    router = TestBed.inject(Router) as any;
    dialog = TestBed.inject(DialogService) as any;
    excel = TestBed.inject(ExcelService) as any;
    snackbar = TestBed.inject(SnackbarService) as any;
  });

  it('should create and set breadcrumbs on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    const bc = TestBed.inject(BreadcrumbsService) as any;
    expect(bc.setRoot).toHaveBeenCalled();
    expect(bc.pushPath).toHaveBeenCalled();
  });

  it('should call listar and populate table on paginar success', () => {
    fixture.detectChanges(); // triggers ngOnInit -> paginar
    expect(activityService.listar).toHaveBeenCalledWith(0, 5, undefined, undefined, null);
    expect(component.dataSourceRegistroActividades.length).toBe(1);
    expect(component.paginationData.length).toBe(1);
  });

  it('keeps the Director process filter empty and lists every authorized process', () => {
    fixture.detectChanges();

    expect(component.formFilter.value.procesoElectoral).toBeNull();
    expect(activityService.listar).toHaveBeenCalledWith(0, 5, undefined, undefined, null);
  });

  it('passes selected process, jury, and search filters unchanged', () => {
    fixture.detectChanges();
    component.formFilter.setValue({
      procesoElectoral: { key: 'process-1', value: 'Proceso actual' },
      juradoNacionalEspecial: { key: 'jury-1', value: 'JEE Lima' },
      terminoBusqueda: ' PREV ',
    });

    component.paginar();

    expect(activityService.listar).toHaveBeenCalledWith(0, 5, 'process-1', 'jury-1', ' PREV ');
  });

  it('should clear table on paginar error', () => {
    (activityService.listar as any).and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges(); // ngOnInit -> paginar
    expect(component.dataSourceRegistroActividades).toEqual([]);
    expect(component.listLoadFailed).toBeTrue();
    expect(snackbar.openErrorSnackBar).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudieron cargar los registros',
    );
  });

  it('keeps a successful empty response distinct from a request failure', () => {
    activityService.listar.and.returnValue(
      of({
        ...paginateResponse,
        registroActividades: [],
        totalElementos: 0,
      }),
    );

    fixture.detectChanges();

    expect(component.dataSourceRegistroActividades).toEqual([]);
    expect(component.listLoadFailed).toBeFalse();
    expect(snackbar.openErrorSnackBar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('should handle page change and repaginate', () => {
    fixture.detectChanges();
    const spyPaginar = spyOn(component as any, 'paginar').and.callThrough();
    component['onPageChange']({
      pageEvent: { pageIndex: 1, pageSize: 10 } as PageEvent,
      sort: null,
    });
    expect(activityService.listar).toHaveBeenCalledWith(1, 10, undefined, undefined, null);
    expect(component.paginationData.pageSize).toBe(10);
    expect(spyPaginar).toHaveBeenCalled();
  });

  it('should navigate to edit on EDIT option', () => {
    component['onOptionSelect']({ menuItem: MENU_ACTIONS_ITEM.EDIT, element: registroMock as any });
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should confirm and delete on DELETE option', () => {
    spyOn(component as any, 'paginar');
    component['onOptionSelect']({
      menuItem: MENU_ACTIONS_ITEM.DELETE,
      element: registroMock as any,
    });
    expect(dialog.openDialogConfirmacion).toHaveBeenCalled();
    expect(activityService.eliminar).toHaveBeenCalledWith('REG-1');
  });

  it('should export registro and participants on EXPORT option', async () => {
    await component['exportRegistroConParticipantes'](registroMock as any);
    expect(excel.exportSheetWithDetailsAndTable).toHaveBeenCalled();
  });

  it('should build participants table flags correctly in export', async () => {
    await component['exportRegistroConParticipantes'](registroMock as any);
    const callArgs = excel.exportSheetWithDetailsAndTable.calls.mostRecent().args[0];
    expect(callArgs.details['Código']).toBe('COD-1');
    // tableRows length equals participantes length
    expect(callArgs.tableRows.length).toBe(2);
    // flags mapping
    const first = callArgs.tableRows[0];
    expect(first['Indígena']).toBeTrue();
    expect(first['Discapacitado']).toBeFalse();
    expect(first['Afro-Peruano']).toBeFalse();
  });

  it('should handle empty participantes when exporting', async () => {
    const reg = { ...registroMock, participantes: [] } as any;
    activityService.obtener.and.returnValue(of(reg));
    await component['exportRegistroConParticipantes'](reg);
    const callArgs = excel.exportSheetWithDetailsAndTable.calls.mostRecent().args[0];
    expect(callArgs.tableHeaders).toEqual([]);
    expect(callArgs.tableRows).toEqual([]);
  });

  it('exports all matching records and closes loading after workbook success', async () => {
    await component.exportRegistros();

    expect(activityService.listarTodos).toHaveBeenCalledWith(undefined, undefined, null);
    expect(excel.jsonToExcel).toHaveBeenCalled();
    expect(snackbar.openSuccessSnackBar).toHaveBeenCalledWith('Reporte exportado correctamente.');
    expect(dialog.closeDialog).toHaveBeenCalled();
  });

  it('does not generate a workbook for an empty export and closes loading', async () => {
    activityService.listarTodos.and.returnValue(of([]));

    await component.exportRegistros();

    expect(excel.jsonToExcel).not.toHaveBeenCalled();
    expect(snackbar.openWarningSnackBar).toHaveBeenCalledWith('No hay registros para exportar.');
    expect(dialog.closeDialog).toHaveBeenCalled();
  });

  it('reports export retrieval failures and closes loading', async () => {
    activityService.listarTodos.and.returnValue(throwError(() => new Error('query failed')));

    await component.exportRegistros();

    expect(excel.jsonToExcel).not.toHaveBeenCalled();
    expect(snackbar.openErrorSnackBar).toHaveBeenCalledWith(
      'No se pudo generar el reporte. Inténtelo nuevamente.',
    );
    expect(dialog.closeDialog).toHaveBeenCalled();
  });

  it('reports workbook failures and closes loading', async () => {
    excel.jsonToExcel.and.returnValue(Promise.reject(new Error('workbook failed')));

    await component.exportRegistros();

    expect(snackbar.openErrorSnackBar).toHaveBeenCalledWith(
      'No se pudo generar el reporte. Inténtelo nuevamente.',
    );
    expect(dialog.closeDialog).toHaveBeenCalled();
  });
});
