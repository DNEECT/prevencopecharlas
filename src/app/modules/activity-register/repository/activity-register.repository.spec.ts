import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SupabaseService } from '@shared/service/supabase/supabase.service';
import {
  ActivityExportRetrievalError,
  ActivityRegisterRepository,
  evidenceForKind,
} from './activity-register.repository';

function queryResult(result: unknown) {
  const query: any = {};
  ['select', 'eq', 'order', 'range', 'single', 'ilike', 'or', 'limit'].forEach((method) => {
    query[method] = jasmine.createSpy(method).and.returnValue(query);
  });
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

const activityRow = {
  id: 'activity-1',
  code: 'PREV0007',
  place: 'Lima',
  activity_date: '2026-09-22',
  activity_time: '10:30:00',
  activity_format_id: 'format-1',
  activity_type_id: 'type-1',
  activity_type_name: 'Charla',
  assistant_type_id: 'assistant-1',
  assistant_type_name: 'Ciudadanía',
  target_audience_id: 'target-1',
  target_audience_name: 'Público general',
  electoral_process_id: 'process-1',
  electoral_process_name: 'Elecciones',
  special_jury_id: 'jury-1',
  jury_name: 'JEE Lima',
  topic: 'Prevención',
  series: 'PREV',
  next_number: 8,
  participant_count: 1,
  created_at: '2026-10-16T12:00:00.000Z',
};

const secondActivityRow = {
  ...activityRow,
  id: 'activity-2',
  code: 'PREV0006',
  electoral_process_id: 'process-2',
  electoral_process_name: 'Elecciones históricas',
};

const request = {
  datos: {
    codTipoActividad: 'type-1',
    tema: 'format-1',
    codTipoAsistentes: 'assistant-1',
    codPublicoObjetivo: 'target-1',
    lugar: 'Lima',
    codProcesoElectoral: 'process-1',
    codJuradoNacionalEspecial: 'jury-1',
    fecha: '2026-09-22',
    hora: '10:30',
    preguntas: 'Preguntas',
    recomendaciones: 'Recomendaciones',
    participantes: [
      {
        dni: '12345678',
        nombresCompletos: 'Persona Uno',
        sexo: 'F',
        edad: 30,
        organizacion: 'JNE',
        cargo: null,
        telefono: null,
        correo: null,
        poblacion: null,
      },
    ],
  },
};

describe('ActivityRegisterRepository', () => {
  let repository: ActivityRegisterRepository;
  let client: any;

  beforeEach(() => {
    client = {
      from: jasmine.createSpy('from'),
      rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: 1, error: null })),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ActivityRegisterRepository,
        { provide: SupabaseService, useValue: { client } },
      ],
    });
    repository = TestBed.inject(ActivityRegisterRepository);
  });

  it('maps scoped activity rows and applies process, code, and optional jury filters', async () => {
    const query = queryResult({ data: [activityRow], count: 1, error: null });
    client.from.and.returnValue(query);

    const response = await firstValueFrom(
      repository.listar(0, 20, 'process-1', 'jury-1', '  PREV  '),
    );

    expect(client.from).toHaveBeenCalledWith('activity_list');
    expect(query.eq).toHaveBeenCalledWith('electoral_process_id', 'process-1');
    expect(query.eq).toHaveBeenCalledWith('special_jury_id', 'jury-1');
    expect(query.ilike).toHaveBeenCalledWith('code', '%PREV%');
    expect(query.range).toHaveBeenCalledWith(0, 19);
    expect(response.registroActividades[0]).toEqual(
      jasmine.objectContaining({
        codigoRegistroActividad: 'activity-1',
        codigo: 'PREV0007',
        nombreJuradoNacionalEspecial: 'JEE Lima',
        cantidadParticipantes: 1,
      }),
    );
  });

  it('loads an unfiltered Director page and obtains paginator metadata separately', async () => {
    const query = queryResult({ data: [activityRow, secondActivityRow], error: null });
    client.from.and.returnValue(query);
    client.rpc.and.returnValue(Promise.resolve({ data: 2, error: null }));

    const response = await firstValueFrom(repository.listar(0, 5, null, null, null));

    expect(query.select).toHaveBeenCalledOnceWith('*');
    expect(query.eq).not.toHaveBeenCalled();
    expect(query.ilike).not.toHaveBeenCalled();
    expect(query.range).toHaveBeenCalledOnceWith(0, 4);
    expect(client.rpc).toHaveBeenCalledOnceWith('count_authorized_activities', {
      p_process_id: null,
      p_jury_id: null,
      p_search: null,
    });
    expect(response.registroActividades.map((row) => row.codigoRegistroActividad)).toEqual([
      'activity-1',
      'activity-2',
    ]);
    expect(response.totalElementos).toBe(2);
  });

  it('passes page filters to both the bounded row query and authorized count', async () => {
    const query = queryResult({ data: [activityRow], error: null });
    client.from.and.returnValue(query);
    client.rpc.and.returnValue(Promise.resolve({ data: 1, error: null }));

    await firstValueFrom(repository.listar(1, 20, 'process-1', 'jury-1', ' PREV '));

    expect(query.eq).toHaveBeenCalledWith('electoral_process_id', 'process-1');
    expect(query.eq).toHaveBeenCalledWith('special_jury_id', 'jury-1');
    expect(query.ilike).toHaveBeenCalledWith('code', '%PREV%');
    expect(query.range).toHaveBeenCalledOnceWith(20, 39);
    expect(client.rpc).toHaveBeenCalledOnceWith('count_authorized_activities', {
      p_process_id: 'process-1',
      p_jury_id: 'jury-1',
      p_search: 'PREV',
    });
  });

  it('exports 1,681 rows once with tied timestamps and participant totals', async () => {
    const rows = Array.from({ length: 1681 }, (_, index) => ({
      ...activityRow,
      id: `activity-${String(1681 - index).padStart(4, '0')}`,
      code: `PREV${String(1681 - index).padStart(4, '0')}`,
      created_at: `2026-10-${String(16 - Math.floor(index / 500)).padStart(2, '0')}T12:00:00.000Z`,
      participant_count: index % 79,
    }));
    const pages = [
      rows.slice(0, 500),
      rows.slice(500, 1000),
      rows.slice(1000, 1500),
      rows.slice(1500),
    ];
    const queries = pages.map((data) => queryResult({ data, error: null }));
    client.from.and.returnValues(...queries);

    const response = await firstValueFrom(repository.listarTodos(null, null, null));

    expect(client.from).toHaveBeenCalledTimes(4);
    expect(new Set(response.map((row) => row.codigoRegistroActividad)).size).toBe(1681);
    expect(response.length).toBe(1681);
    expect(response[78].cantidadParticipantes).toBe(78);
    const firstPage = queries[0];
    expect(firstPage.select).toHaveBeenCalledOnceWith('*');
    expect(firstPage.order.calls.allArgs()).toEqual([
      ['created_at', { ascending: false }],
      ['id', { ascending: false }],
    ]);
    expect(firstPage.limit).toHaveBeenCalledOnceWith(500);
    expect(queries[1].or).toHaveBeenCalledWith(
      'created_at.lt.2026-10-16T12:00:00.000Z,and(created_at.eq.2026-10-16T12:00:00.000Z,id.lt.activity-1182)',
    );
    expect(queries[3].limit).toHaveBeenCalledOnceWith(500);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('applies all filters to every keyset page', async () => {
    const firstPage = queryResult({ data: [activityRow, secondActivityRow], error: null });
    const finalPage = queryResult({ data: [], error: null });
    client.from.and.returnValues(firstPage, finalPage);

    await firstValueFrom(repository.listarTodos('process-1', 'jury-1', ' PREV ', 2));

    for (const query of [firstPage, finalPage]) {
      expect(query.eq).toHaveBeenCalledWith('electoral_process_id', 'process-1');
      expect(query.eq).toHaveBeenCalledWith('special_jury_id', 'jury-1');
      expect(query.ilike).toHaveBeenCalledWith('code', '%PREV%');
    }
    expect(finalPage.or).toHaveBeenCalledWith(
      'created_at.lt.2026-10-16T12:00:00.000Z,and(created_at.eq.2026-10-16T12:00:00.000Z,id.lt.activity-2)',
    );
  });

  it('aborts after a later export page fails with safe retrieval diagnostics', async () => {
    const firstPage = queryResult({ data: [activityRow, secondActivityRow], error: null });
    const failedPage = queryResult({
      data: null,
      error: { code: '57014', status: 500, message: 'statement timeout', details: 'row data' },
    });
    client.from.and.returnValues(firstPage, failedPage);

    let failure: unknown;
    try {
      await firstValueFrom(repository.listarTodos(null, null, null, 2));
    } catch (error) {
      failure = error;
    }

    expect(client.from).toHaveBeenCalledTimes(2);
    expect(failure).toEqual(jasmine.any(ActivityExportRetrievalError));
    const retrievalFailure = failure as ActivityExportRetrievalError;
    expect(retrievalFailure.page).toBe(1);
    expect(retrievalFailure.sourceCode).toBe('57014');
    expect(retrievalFailure.sourceMessage).toBe('statement timeout');
    expect(retrievalFailure as any).not.toEqual(jasmine.objectContaining({ details: 'row data' }));
  });

  it('loads participants, detail fields, and unavailable legacy evidence', async () => {
    const queries: Record<string, any[]> = {
      activity_list: [queryResult({ data: activityRow, error: null })],
      activity_registrations: [
        queryResult({
          data: {
            observations: 'Observación',
            questions: 'Preguntas',
            recommendations: 'Recomendaciones',
            legacy_attendance_path: 'legacy/lista.pdf',
            legacy_photo_path: null,
          },
          error: null,
        }),
      ],
      activity_evidence: [
        queryResult({
          data: [
            {
              kind: 'attendance-list',
              object_path: null,
              is_available: false,
              legacy_reference: 'legacy/lista.pdf',
              original_name: 'lista.pdf',
            },
          ],
          error: null,
        }),
      ],
      activity_participants: [
        queryResult({
          data: [
            {
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
          ],
          error: null,
        }),
      ],
    };
    client.from.and.callFake((table: string) => queries[table].shift());

    const response = await firstValueFrom(repository.obtener('activity-1'));

    expect(response.datos.participantes[0]).toEqual({
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
    expect(response.datos.adjuntoListaAsistentes).toBeNull();
    expect(response.datos.adjuntoListaAsistentesNoDisponible).toBe('lista.pdf');
    expect(response.datos.observaciones).toBe('Observación');
  });

  it('sends create and replace through transactional RPCs with participants', async () => {
    client.rpc.and.callFake((name: string) =>
      Promise.resolve(
        name === 'create_activity'
          ? { data: [{ activity_id: 'activity-1', activity_code: 'PREV0007' }], error: null }
          : { data: null, error: null },
      ),
    );

    const created = await firstValueFrom(repository.crear(request));
    await firstValueFrom(repository.actualizar(request, 'activity-1'));
    await firstValueFrom(repository.eliminar('activity-1'));

    expect(created.datos).toEqual({ codigo: 'activity-1', mensaje: 'PREV0007' });
    expect(client.rpc).toHaveBeenCalledWith(
      'create_activity',
      jasmine.objectContaining({
        p_format_id: 'format-1',
        p_jury_id: 'jury-1',
        p_participants: request.datos.participantes,
      }),
    );
    expect(client.rpc).toHaveBeenCalledWith(
      'replace_activity',
      jasmine.objectContaining({
        p_activity_id: 'activity-1',
        p_participants: request.datos.participantes,
      }),
    );
    expect(client.rpc).toHaveBeenCalledWith('archive_activity', {
      p_activity_id: 'activity-1',
    });
  });

  it('rejects missing required catalogs before calling Supabase', async () => {
    const invalid = { datos: { ...request.datos, codJuradoNacionalEspecial: null } };
    await expectAsync(firstValueFrom(repository.crear(invalid))).toBeRejectedWithError(
      'Seleccione todos los catálogos requeridos.',
    );
    expect(client.rpc).not.toHaveBeenCalled();
  });
});

describe('evidenceForKind', () => {
  it('shows a missing historical reference without making it downloadable', () => {
    expect(evidenceForKind([], 'attendance-list', 'legacy/lista.pdf')).toEqual({
      path: null,
      unavailable: 'legacy/lista.pdf',
    });
  });

  it('uses an unavailable evidence record when no Storage object exists', () => {
    expect(
      evidenceForKind(
        [
          {
            kind: 'photographic-record',
            object_path: null,
            legacy_reference: 'legacy/photo.jpg',
            original_name: 'photo.jpg',
            is_available: false,
          },
        ],
        'photographic-record',
        null,
      ),
    ).toEqual({
      path: null,
      unavailable: 'photo.jpg',
    });
  });

  it('prefers a verified Storage object over an unavailable reference', () => {
    expect(
      evidenceForKind(
        [
          {
            kind: 'attendance-list',
            object_path: null,
            legacy_reference: 'old.pdf',
            original_name: null,
            is_available: false,
          },
          {
            kind: 'attendance-list',
            object_path: 'activity/attendance-list/new.pdf',
            legacy_reference: null,
            original_name: 'new.pdf',
            is_available: true,
          },
        ],
        'attendance-list',
        'old.pdf',
      ),
    ).toEqual({
      path: 'activity/attendance-list/new.pdf',
      unavailable: null,
    });
  });
});
