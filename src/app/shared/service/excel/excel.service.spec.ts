import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as ExcelJS from 'exceljs';

import { ExcelService } from './excel.service';

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    service = TestBed.inject(ExcelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('rejects empty input before deriving workbook columns', async () => {
    await expectAsync(service.jsonToExcel([], 'empty')).toBeRejectedWithError(
      'No hay datos para exportar.',
    );
  });

  it('awaits one workbook save and preserves participant totals', async () => {
    const saveSpy = spyOn<any>(service, 'saveAsExcelFile');

    await service.jsonToExcel(
      [
        { Código: 'PREV0001', 'Cantidad de participantes': 9 },
        { Código: 'PREV0002', 'Cantidad de participantes': 78 },
      ],
      'reporte',
    );

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy.calls.mostRecent().args[1]).toBe('reporte');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(saveSpy.calls.mostRecent().args[0] as any);
    const worksheet = workbook.worksheets[0];
    expect(worksheet.getRow(1).values).toEqual([, 'Código', 'Cantidad de participantes']);
    expect(worksheet.getRow(2).values).toEqual([, 'PREV0001', 9]);
    expect(worksheet.getRow(3).values).toEqual([, 'PREV0002', 78]);
  });

  it('rejects when workbook buffer generation fails and does not save', async () => {
    const saveSpy = spyOn<any>(service, 'saveAsExcelFile');
    spyOn<any>(service, 'createWorkbook').and.returnValue({
      addWorksheet: () => ({ addRow: () => undefined }),
      xlsx: { writeBuffer: () => Promise.reject(new Error('buffer failed')) },
    });

    await expectAsync(
      service.jsonToExcel([{ Código: 'PREV0001' }], 'reporte'),
    ).toBeRejectedWithError('buffer failed');
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
