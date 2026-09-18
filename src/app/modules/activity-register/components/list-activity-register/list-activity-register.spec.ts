import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import ListActivityRegister from './list-activity-register';
import { Router } from '@angular/router';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ActivityRegisterService } from '@modules/activity-register/service/activity-register.service';
import { of, Subject, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { MENU_ACTIONS_ITEM } from '@shared/const/menu-acciones.const';
import { ExcelService } from '@shared/service/excel/excel.service';

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
}

class ActivityRegisterServiceStub {
  listar = jasmine.createSpy('listar').and.returnValue(of(paginateResponse));
  eliminar = jasmine.createSpy('eliminar').and.returnValue(of(void 0));
}

class ExcelServiceStub {
  exportSheetWithDetailsAndTable = jasmine
    .createSpy('exportSheetWithDetailsAndTable')
    .and.returnValue(Promise.resolve());
}

describe('ListActivityRegister', () => {
  let component: ListActivityRegister;
  let fixture: ComponentFixture<ListActivityRegister>;
  let activityService: ActivityRegisterServiceStub;
  let router: RouterStub;
  let dialog: DialogServiceStub;
  let excel: ExcelServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListActivityRegister],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: BreadcrumbsService, useClass: BreadcrumbsServiceStub },
        { provide: DialogService, useClass: DialogServiceStub },
        { provide: SnackbarService, useClass: SnackbarServiceStub },
        { provide: ActivityRegisterService, useClass: ActivityRegisterServiceStub },
        { provide: ExcelService, useClass: ExcelServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListActivityRegister);
    component = fixture.componentInstance;
    activityService = TestBed.inject(ActivityRegisterService) as any;
    router = TestBed.inject(Router) as any;
    dialog = TestBed.inject(DialogService) as any;
    excel = TestBed.inject(ExcelService) as any;
  });

  it('should create and set breadcrumbs on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    const bc = TestBed.inject(BreadcrumbsService) as any;
    expect(bc.setRoot).toHaveBeenCalled();
    expect(bc.pushPath).toHaveBeenCalled();
  });

  it('should call listar and populate table on paginar success', fakeAsync(() => {
    fixture.detectChanges(); // triggers ngOnInit -> paginar
    tick();
    expect(activityService.listar).toHaveBeenCalledWith(0, 5);
    expect(component.dataSourceRegistroActividades.length).toBe(1);
    expect(component.paginationData.length).toBe(1);
  }));

  it('should clear table on paginar error', fakeAsync(() => {
    (activityService.listar as any).and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges(); // ngOnInit -> paginar
    tick();
    expect(component.dataSourceRegistroActividades).toEqual([]);
  }));

  it('should handle page change and repaginate', fakeAsync(() => {
    fixture.detectChanges();
    const spyPaginar = spyOn(component as any, 'paginar').and.callThrough();
    component['onPageChange']({
      pageEvent: { pageIndex: 1, pageSize: 10 } as PageEvent,
      sort: null,
    });
    expect(component.paginationData.pageIndex).toBe(1);
    expect(component.paginationData.pageSize).toBe(10);
    expect(spyPaginar).toHaveBeenCalled();
  }));

  it('should navigate to edit on EDIT option', fakeAsync(() => {
    component['onOptionSelect']({ menuItem: MENU_ACTIONS_ITEM.EDIT, element: registroMock as any });
    expect(router.navigate).toHaveBeenCalled();
  }));

  it('should confirm and delete on DELETE option', fakeAsync(() => {
    spyOn(component as any, 'paginar');
    component['onOptionSelect']({
      menuItem: MENU_ACTIONS_ITEM.DELETE,
      element: registroMock as any,
    });
    expect(dialog.openDialogConfirmacion).toHaveBeenCalled();
    expect(activityService.eliminar).toHaveBeenCalledWith('REG-1');
  }));

  it('should export registro and participants on EXPORT option', fakeAsync(async () => {
    await component['exportRegistroConParticipantes'](registroMock as any);
    expect(excel.exportSheetWithDetailsAndTable).toHaveBeenCalled();
  }));

  it('should build participants table flags correctly in export', fakeAsync(async () => {
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
  }));

  it('should handle empty participantes when exporting', fakeAsync(async () => {
    const reg = { ...registroMock, participantes: [] } as any;
    await component['exportRegistroConParticipantes'](reg);
    const callArgs = excel.exportSheetWithDetailsAndTable.calls.mostRecent().args[0];
    expect(callArgs.tableHeaders).toEqual([]);
    expect(callArgs.tableRows).toEqual([]);
  }));
});
