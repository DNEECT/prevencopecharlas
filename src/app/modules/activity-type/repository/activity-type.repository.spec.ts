import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { ActivityTypeRepository } from './activity-type.repository';

function queryResult(result: unknown) {
  const query: any = {};
  ['select', 'eq', 'order', 'range', 'single', 'insert', 'update'].forEach((method) => {
    query[method] = jasmine.createSpy(method).and.returnValue(query);
  });
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

describe('ActivityTypeRepository', () => {
  let repository: ActivityTypeRepository;
  let client: any;

  beforeEach(() => {
    client = { from: jasmine.createSpy('from'), rpc: jasmine.createSpy('rpc') };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ActivityTypeRepository,
        { provide: SupabaseService, useValue: { client } },
      ],
    });
    repository = TestBed.inject(ActivityTypeRepository);
  });

  it('maps an active paginated list to the Spanish interface', async () => {
    const query = queryResult({
      data: [{ id: 'type-1', name: 'Charla', description: null }],
      count: 1,
      error: null,
    });
    client.from.and.returnValue(query);

    const response = await firstValueFrom(repository.listar(1, 10));

    expect(client.from).toHaveBeenCalledWith('activity_types');
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.range).toHaveBeenCalledWith(10, 19);
    expect(response).toEqual({
      tiposActividades: [{
        codigoTipoActividad: 'type-1', nombre: 'Charla', descripcion: '',
      }],
      totalElementos: 1,
      numeroPagina: 1,
      tamanioPagina: 10,
    });
  });

  it('trims fields before creating a type', async () => {
    const query = queryResult({ error: null });
    client.from.and.returnValue(query);

    await firstValueFrom(repository.crear({
      datos: { nombre: '  Taller  ', descripcion: '  Descripción  ' },
    }));

    expect(query.insert).toHaveBeenCalledWith({
      name: 'Taller', description: 'Descripción',
    });
  });

  it('requires an active updated row and archives through the RPC', async () => {
    const query = queryResult({ data: [{ id: 'type-1' }], error: null });
    client.from.and.returnValue(query);
    client.rpc.and.resolveTo({ error: null });

    await firstValueFrom(repository.actualizar({
      datos: { nombre: ' Taller ', descripcion: ' Tema ' },
    }, 'type-1'));
    await firstValueFrom(repository.eliminar('type-1'));

    expect(query.update).toHaveBeenCalledWith({ name: 'Taller', description: 'Tema' });
    expect(query.eq).toHaveBeenCalledWith('id', 'type-1');
    expect(client.rpc).toHaveBeenCalledWith('archive_activity_type', { p_id: 'type-1' });
  });
});
