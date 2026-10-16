import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PermisionDataService } from './permision-data.service';

describe('PermisionDataService', () => {
  let service: PermisionDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    service = TestBed.inject(PermisionDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('publishes permission changes to active layout subscribers', () => {
    const emissions: unknown[] = [];
    const subscription = service.data$.subscribe((value) => emissions.push(value));

    service.setData([{ title: 'Permisos', abreviatura: 'GPRM' }]);
    service.clearData();

    expect(emissions).toEqual([null, [{ title: 'Permisos', abreviatura: 'GPRM' }], null]);
    subscription.unsubscribe();
  });
});
