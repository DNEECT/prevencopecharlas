import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { ActivityFormatRepository } from './activity-format.repository';

function queryResult(result: unknown) {
  const query: any = {};
  ['select', 'eq', 'order', 'range', 'single', 'insert', 'update'].forEach((method) => {
    query[method] = jasmine.createSpy(method).and.returnValue(query);
  });
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

describe('ActivityFormatRepository', () => {
  let repository: ActivityFormatRepository;
  let client: any;

  beforeEach(() => {
    client = { from: jasmine.createSpy('from'), rpc: jasmine.createSpy('rpc') };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ActivityFormatRepository,
        { provide: SupabaseService, useValue: { client } },
      ],
    });
    repository = TestBed.inject(ActivityFormatRepository);
  });

  it('maps joined format rows and applies active filters', async () => {
    const query = queryResult({
      data: [{
        id: 'format-1', activity_type_id: 'type-1', topic: 'Prevención',
        series: 'PREV', next_number: 7, activity_types: [{ name: 'Charla' }],
      }],
      count: 1,
      error: null,
    });
    client.from.and.returnValue(query);

    const response = await firstValueFrom(repository.listar(0, 5));

    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.eq).toHaveBeenCalledWith('activity_types.is_active', true);
    expect(query.range).toHaveBeenCalledWith(0, 4);
    expect(response.formatosActividades[0]).toEqual({
      codigoFormatoActividad: 'format-1',
      codTipoActividad: 'type-1',
      descripcionTipoActividad: 'Charla',
      tema: 'Prevención',
      serie: 'PREV',
      numeracion: 7,
    });
  });

  it('leaves generated activity codes to the transactional create RPC', async () => {
    const response = await firstValueFrom(repository.consultarCodigoSiguiente('type-1', 'Tema'));
    expect(response.datos).toBe('Se asignará al guardar');
  });

  it('trims writes and archives formats through the RPC', async () => {
    const query = queryResult({ data: [{ id: 'format-1' }], error: null });
    client.from.and.returnValue(query);
    client.rpc.and.resolveTo({ error: null });
    const request = {
      datos: { codTipoActividad: 'type-1', tema: ' Tema ', serie: ' SER ' },
    };

    await firstValueFrom(repository.crear(request));
    await firstValueFrom(repository.actualizar(request, 'format-1'));
    await firstValueFrom(repository.eliminar('format-1'));

    const payload = { activity_type_id: 'type-1', topic: 'Tema', series: 'SER' };
    expect(query.insert).toHaveBeenCalledWith(payload);
    expect(query.update).toHaveBeenCalledWith(payload);
    expect(client.rpc).toHaveBeenCalledWith('archive_activity_format', { p_id: 'format-1' });
  });
});
