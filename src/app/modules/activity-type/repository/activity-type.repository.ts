import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { from, Observable } from 'rxjs';
import { MensajeDatosResponse } from '@shared/interface/api.interface';
import {
  TipoActividadDatosRequest, TipoActividadDatosResponse,
  TipoActividadPaginateResponse, TipoActividadResponse,
} from '@modules/activity-type/interface/activity-type';

interface ActivityTypeRow { id: string; name: string; description: string | null }
const mapRow = (row: ActivityTypeRow): TipoActividadResponse => ({
  codigoTipoActividad: row.id, nombre: row.name, descripcion: row.description ?? '',
});

@Injectable({ providedIn: 'root' })
export class ActivityTypeRepository {
  private readonly supabaseService = inject(SupabaseService);
  private get client() { return this.supabaseService.client; }

  public listar(numeroPagina: number | null, tamanioPagina: number | null): Observable<TipoActividadPaginateResponse> {
    return from(this.loadList(numeroPagina, tamanioPagina));
  }

  private async loadList(page: number | null, size: number | null): Promise<TipoActividadPaginateResponse> {
    let query = this.client.from('activity_types').select('id,name,description', { count: 'exact' })
      .eq('is_active', true).order('name');
    if (page !== null && size !== null) query = query.range(page * size, (page + 1) * size - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    return {
      tiposActividades: ((data ?? []) as ActivityTypeRow[]).map(mapRow),
      totalElementos: count ?? 0, numeroPagina: page ?? 0, tamanioPagina: size ?? count ?? 0,
    };
  }

  public obtener(id: string): Observable<TipoActividadDatosResponse> {
    return from((async () => {
      const { data, error } = await this.client.from('activity_types').select('id,name,description')
        .eq('id', id).eq('is_active', true).single();
      if (error) throw error;
      return { datos: mapRow(data) };
    })());
  }

  public crear(request: TipoActividadDatosRequest): Observable<MensajeDatosResponse> {
    return from((async () => {
      const { error } = await this.client.from('activity_types').insert({
        name: request.datos.nombre?.trim(), description: request.datos.descripcion?.trim(),
      });
      if (error) throw error;
      return { datos: { codigo: 'OK', mensaje: 'Tipo de actividad registrado' } };
    })());
  }

  public actualizar(request: TipoActividadDatosRequest, id: string): Observable<MensajeDatosResponse> {
    return from((async () => {
      const { data, error } = await this.client.from('activity_types').update({
        name: request.datos.nombre?.trim(), description: request.datos.descripcion?.trim(),
      }).eq('id', id).eq('is_active', true).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('No se encontró el tipo de actividad o no tiene permiso.');
      return { datos: { codigo: 'OK', mensaje: 'Tipo de actividad actualizado' } };
    })());
  }

  public eliminar(id: string): Observable<void> {
    return from((async () => {
      const { error } = await this.client.rpc('archive_activity_type', { p_id: id });
      if (error) throw error;
    })());
  }
}
