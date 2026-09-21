import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { PublicoObjetivoDatosResponse } from '@modules/activity-format/interface/target-audience';

@Injectable({ providedIn: 'root' })
export class TargetAudienceRepository {
  private readonly supabase = inject(SupabaseService);

  public listar(): Observable<PublicoObjetivoDatosResponse> {
    return from((async () => {
      const { data, error } = await this.supabase.client.from('target_audiences')
        .select('id,name,description').eq('is_active', true).order('name');
      if (error) throw error;
      return { datos: (data ?? []).map((row) => ({
        codigoPublicoObjetivo: row.id, nombre: row.name, descripcion: row.description ?? '',
      })) };
    })());
  }
}
