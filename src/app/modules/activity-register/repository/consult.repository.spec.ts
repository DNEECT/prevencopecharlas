import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { ConsultRepository } from './consult.repository';

function queryResult(result: unknown) {
  const query: any = {};
  ['select', 'eq', 'order', 'limit', 'maybeSingle'].forEach((method) => {
    query[method] = jasmine.createSpy(method).and.returnValue(query);
  });
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

describe('ConsultRepository', () => {
  let repository: ConsultRepository;
  let client: any;

  beforeEach(() => {
    client = { from: jasmine.createSpy('from') };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ConsultRepository,
        { provide: SupabaseService, useValue: { client } },
      ],
    });
    repository = TestBed.inject(ConsultRepository);
  });

  it('returns the most recently updated accessible participant with the DNI', async () => {
    const query = queryResult({
      data: {
        dni: '12345678',
        full_name: 'Persona Uno',
        sex: 'F',
        age: 30,
        organization: 'JNE',
        position: null,
        phone: null,
        email: null,
        population: null,
      },
      error: null,
    });
    client.from.and.returnValue(query);

    const response = await firstValueFrom(repository.consultarParticipante('12345678'));

    expect(client.from).toHaveBeenCalledWith('activity_participants');
    expect(query.eq).toHaveBeenCalledWith('dni', '12345678');
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    expect(response).toEqual({
      dni: '12345678',
      nombresCompletos: 'Persona Uno',
      sexo: 'F',
      edad: 30,
      organizacion: 'JNE',
      cargo: '',
      telefono: '',
      correo: '',
      poblacion: '',
    });
  });

  it('keeps new participants available for manual entry', async () => {
    client.from.and.returnValue(queryResult({ data: null, error: null }));

    await expectAsync(
      firstValueFrom(repository.consultarParticipante('00000000')),
    ).toBeRejectedWithError(
      'DNI sin antecedentes. Complete los datos del participante manualmente.',
    );
  });
});
