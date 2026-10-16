import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ElectoralprocessRepository } from './electoralprocess.repository';
import { SupabaseService } from '@shared/service/supabase/supabase.service';

function queryResult(result: unknown) {
  const query: any = {};
  ['select', 'eq', 'order'].forEach((method) => {
    query[method] = jasmine.createSpy(method).and.returnValue(query);
  });
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

describe('ElectoralprocessRepository', () => {
  let repository: ElectoralprocessRepository;
  let client: any;

  beforeEach(() => {
    client = { from: jasmine.createSpy('from') };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ElectoralprocessRepository,
        { provide: SupabaseService, useValue: { client } },
      ],
    });
    repository = TestBed.inject(ElectoralprocessRepository);
  });

  it('limits registration forms to writable processes', async () => {
    const query = queryResult({ data: [], error: null });
    client.from.and.returnValue(query);

    await firstValueFrom(repository.listar());

    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.eq).toHaveBeenCalledWith('accepts_registrations', true);
  });

  it('includes read-only historical processes for the activity list', async () => {
    const query = queryResult({
      data: [{
        id: 'general', name: 'Elecciones Generales 2026', description: 'Histórico',
        is_default: false,
      }],
      error: null,
    });
    client.from.and.returnValue(query);

    const response = await firstValueFrom(repository.listar(true));

    expect(query.eq).not.toHaveBeenCalledWith('accepts_registrations', true);
    expect(response.datos[0].codigoProcesoElectoral).toBe('general');
  });
});
