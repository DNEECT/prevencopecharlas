import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { from, Observable } from 'rxjs';
import {
  RegistroActividadDatosRequest, RegistroActividadDatosResponse,
  RegistroActividadPaginateResponse, RegistroActividadResponse,
  RegistroActividadParticipanteResponse, RegistroActividadRequest,
} from '@modules/activity-register/interface/activity-register';
import { MensajeDatosResponse } from '@shared/interface/api.interface';

interface ActivityRow {
  id: string; code: string; place: string; activity_date: string; activity_time: string;
  activity_format_id: string; activity_type_id: string; activity_type_name: string;
  assistant_type_id: string; assistant_type_name: string;
  target_audience_id: string; target_audience_name: string;
  electoral_process_id: string; electoral_process_name: string;
  special_jury_id: string; jury_name: string; topic: string; series: string;
  next_number: number; participant_count: number;
}

interface EvidenceRow {
  kind: 'attendance-list' | 'photographic-record';
  object_path: string | null;
  legacy_reference: string | null;
  original_name: string | null;
  is_available: boolean;
}

export function evidenceForKind(evidence: EvidenceRow[], kind: EvidenceRow['kind'],
  legacyPath: string | null | undefined): { path: string | null; unavailable: string | null } {
  const rows = evidence.filter((item) => item.kind === kind);
  const available = rows.find((item) => item.is_available && item.object_path);
  if (available) return { path: available.object_path, unavailable: null };
  const unavailable = rows.find((item) => !item.is_available);
  return {
    path: null,
    unavailable: unavailable?.original_name ?? unavailable?.legacy_reference ?? legacyPath ?? null,
  };
}

function mapRow(row: ActivityRow): RegistroActividadResponse {
  return {
    codigoRegistroActividad: row.id, codigo: row.code,
    codProcesoElectoral: row.electoral_process_id,
    nombreProcesoElectoral: row.electoral_process_name,
    codJuradoNacionalEspecial: row.special_jury_id,
    nombreJuradoNacionalEspecial: row.jury_name,
    codTipoActividad: row.activity_type_id, nombreTipoActividad: row.activity_type_name,
    codTipoAsistente: row.assistant_type_id, nombreTipoAsistente: row.assistant_type_name,
    codPublicoObjetivo: row.target_audience_id, nombrePublicoObjetivo: row.target_audience_name,
    codFormatoActividad: row.activity_format_id,
    lugar: row.place, tema: row.topic, serie: row.series, numeracion: row.next_number,
    fecha: row.activity_date, hora: row.activity_time,
    participantes: [], cantidadParticipantes: row.participant_count,
  };
}

function mapParticipant(row: Record<string, any>): RegistroActividadParticipanteResponse {
  return {
    dni: row['dni'], nombresCompletos: row['full_name'],
    sexo: row['sex'] ?? '', edad: row['age'] ?? 0,
    organizacion: row['organization'] ?? '', cargo: row['position'] ?? '',
    telefono: row['phone'] ?? '', correo: row['email'] ?? '', poblacion: row['population'] ?? '',
  };
}

@Injectable({ providedIn: 'root' })
export class ActivityRegisterRepository {
  private readonly supabaseService = inject(SupabaseService);
  private get client() { return this.supabaseService.client; }

  public listar(page: number | null, size: number | null, juryId: string | null | undefined,
    search: string | null | undefined): Observable<RegistroActividadPaginateResponse> {
    return from((async () => {
      const fetchPage = async (start: number, end: number) => {
        let query = this.client.from('activity_list').select('*', { count: 'exact' })
          .order('created_at', { ascending: false }).order('id', { ascending: false });
        if (juryId) query = query.eq('special_jury_id', juryId);
        if (search?.trim()) query = query.ilike('code', `%${search.trim()}%`);
        return query.range(start, end);
      };
      const rows: ActivityRow[] = [];
      let total = 0;
      const chunkSize = size ?? 500;
      for (let index = page === null ? 0 : page * chunkSize;; index += chunkSize) {
        const { data, count, error } = await fetchPage(index, index + chunkSize - 1);
        if (error) throw error;
        rows.push(...((data ?? []) as ActivityRow[]));
        total = count ?? 0;
        if (page !== null || rows.length >= total || !data?.length) break;
      }
      return {
        registroActividades: rows.map(mapRow),
        totalElementos: total, numeroPagina: page ?? 0, tamanioPagina: size ?? total,
      };
    })());
  }

  public obtener(id: string): Observable<RegistroActividadDatosResponse> {
    return from((async () => {
      const { data: row, error } = await this.client.from('activity_list').select('*')
        .eq('id', id).single();
      if (error) throw error;
      const [{ data: detail, error: detailError },
        { data: evidence, error: evidenceError }] = await Promise.all([
        this.client.from('activity_registrations')
          .select('observations,questions,recommendations,legacy_attendance_path,legacy_photo_path')
          .eq('id', id).single(),
        this.client.from('activity_evidence')
          .select('kind,object_path,is_available,legacy_reference,original_name')
          .eq('activity_id', id).eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);
      if (detailError || evidenceError) throw detailError ?? evidenceError;
      const people: Record<string, any>[] = [];
      for (let start = 0;; start += 500) {
        const { data, error: peopleError } = await this.client.from('activity_participants')
          .select('*').eq('activity_id', id).eq('is_active', true)
          .order('created_at').order('id').range(start, start + 499);
        if (peopleError) throw peopleError;
        people.push(...(data ?? []));
        if ((data?.length ?? 0) < 500) break;
      }
      const mapped = mapRow(row as ActivityRow);
      mapped.observaciones = detail?.observations;
      mapped.preguntas = detail?.questions;
      mapped.recomendaciones = detail?.recommendations;
      mapped.participantes = people.map(mapParticipant);
      const attendance = evidenceForKind((evidence ?? []) as EvidenceRow[],
        'attendance-list', detail?.legacy_attendance_path);
      const photographic = evidenceForKind((evidence ?? []) as EvidenceRow[],
        'photographic-record', detail?.legacy_photo_path);
      mapped.adjuntoListaAsistentes = attendance.path;
      mapped.adjuntoRegistroFotografico = photographic.path;
      mapped.adjuntoListaAsistentesNoDisponible = attendance.unavailable;
      mapped.adjuntoRegistroFotograficoNoDisponible = photographic.unavailable;
      return { datos: mapped };
    })());
  }

  private params(input: RegistroActividadRequest) {
    if (!input.tema || !input.codTipoAsistentes || !input.codPublicoObjetivo
        || !input.codProcesoElectoral || !input.codJuradoNacionalEspecial) {
      throw new Error('Seleccione todos los catálogos requeridos.');
    }
    return {
      p_format_id: input.tema,
      p_assistant_id: input.codTipoAsistentes,
      p_target_id: input.codPublicoObjetivo,
      p_process_id: input.codProcesoElectoral,
      p_jury_id: input.codJuradoNacionalEspecial,
      p_place: input.lugar,
      p_date: input.fecha,
      p_time: input.hora,
      p_questions: input.preguntas,
      p_recommendations: input.recomendaciones,
      p_participants: input.participantes ?? [],
    };
  }

  public crear(request: RegistroActividadDatosRequest): Observable<MensajeDatosResponse> {
    return from((async () => {
      const { data, error } = await this.client.rpc('create_activity', this.params(request.datos));
      if (error) throw error;
      const created = data?.[0];
      if (!created) throw new Error('No se recibió el código de actividad.');
      return { datos: { codigo: created.activity_id, mensaje: created.activity_code } };
    })());
  }

  public actualizar(request: RegistroActividadDatosRequest, id: string): Observable<MensajeDatosResponse> {
    return from((async () => {
      const { error } = await this.client.rpc('replace_activity', {
        p_activity_id: id, ...this.params(request.datos),
      });
      if (error) throw error;
      return { datos: { codigo: id, mensaje: 'Registro actualizado' } };
    })());
  }

  public eliminar(id: string): Observable<void> {
    return from((async () => {
      const { error } = await this.client.rpc('archive_activity', { p_activity_id: id });
      if (error) throw error;
    })());
  }
}
