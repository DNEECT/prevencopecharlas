import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

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
});
