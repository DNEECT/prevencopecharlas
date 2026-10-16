import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { TipoAsistenteDatosResponse } from '@modules/activity-format/interface/asistent-type';

@Injectable({ providedIn: 'root' })
export class AsistentTypeRepository {
  private readonly supabase = inject(SupabaseService);

  public listar(): Observable<TipoAsistenteDatosResponse> {
    return from((async () => {
      const { data, error } = await this.supabase.client.from('assistant_types')
        .select('id,name,description').eq('is_active', true).order('name');
      if (error) throw error;
      return { datos: (data ?? []).map((row) => ({
        codigoTipoAsistente: row.id, nombre: row.name, descripcion: row.description ?? '',
      })) };
    })());
  }
}
