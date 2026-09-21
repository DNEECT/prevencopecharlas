import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { from, Observable } from 'rxjs';
import {
  CodigoRegistroActividadResonse, FormatoActividadDatosRequest,
  FormatoActividadDatosResponse, FormatoActividadPaginateResponse,
  FormatoActividadResponse,
} from '@modules/activity-format/interface/activity-format';
import { MensajeDatosResponse } from '@shared/interface/api.interface';

interface FormatRow {
  id: string; activity_type_id: string; topic: string; series: string;
  next_number: number; activity_types: { name: string } | { name: string }[];
}
const mapRow = (row: FormatRow): FormatoActividadResponse => ({
  codigoFormatoActividad: row.id,
  codTipoActividad: row.activity_type_id,
  descripcionTipoActividad: Array.isArray(row.activity_types)
    ? row.activity_types[0]?.name ?? '' : row.activity_types.name,
  tema: row.topic, serie: row.series, numeracion: row.next_number,
});
const columns = 'id,activity_type_id,topic,series,next_number,activity_types!inner(name)';

@Injectable({ providedIn: 'root' })
export class ActivityFormatRepository {
  private readonly supabaseService = inject(SupabaseService);
  private get client() { return this.supabaseService.client; }

  public listar(page: number | null, size: number | null): Observable<FormatoActividadPaginateResponse> {
    return from((async () => {
      let query = this.client.from('activity_formats').select(columns, { count: 'exact' })
        .eq('is_active', true).eq('activity_types.is_active', true).order('topic');
      if (page !== null && size !== null) query = query.range(page * size, (page + 1) * size - 1);
      const { data, count, error } = await query;
      if (error) throw error;
      return {
        formatosActividades: ((data ?? []) as unknown as FormatRow[]).map(mapRow),
        totalElementos: count ?? 0, numeroPagina: page ?? 0, tamanioPagina: size ?? count ?? 0,
      };
    })());
  }

  public obtener(id: string): Observable<FormatoActividadDatosResponse> {
    return from((async () => {
      const { data, error } = await this.client.from('activity_formats').select(columns)
        .eq('id', id).eq('is_active', true).single();
      if (error) throw error;
      return { datos: mapRow(data as unknown as FormatRow) };
    })());
  }

  public consultarCodigoSiguiente(_typeId: string, _topic: string): Observable<CodigoRegistroActividadResonse> {
    return from(Promise.resolve({ datos: 'Se asignará al guardar' }));
  }

  public crear(request: FormatoActividadDatosRequest): Observable<MensajeDatosResponse> {
    return from((async () => {
      const { error } = await this.client.from('activity_formats').insert({
        activity_type_id: request.datos.codTipoActividad,
        topic: request.datos.tema?.trim(), series: request.datos.serie?.trim(),
      });
      if (error) throw error;
      return { datos: { codigo: 'OK', mensaje: 'Formato registrado' } };
    })());
  }

  public actualizar(request: FormatoActividadDatosRequest, id: string): Observable<MensajeDatosResponse> {
    return from((async () => {
      const { data, error } = await this.client.from('activity_formats').update({
        activity_type_id: request.datos.codTipoActividad,
        topic: request.datos.tema?.trim(), series: request.datos.serie?.trim(),
      }).eq('id', id).eq('is_active', true).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('No se encontró el formato o no tiene permiso.');
      return { datos: { codigo: 'OK', mensaje: 'Formato actualizado' } };
    })());
  }

  public eliminar(id: string): Observable<void> {
    return from((async () => {
      const { error } = await this.client.rpc('archive_activity_format', { p_id: id });
      if (error) throw error;
    })());
  }
}
