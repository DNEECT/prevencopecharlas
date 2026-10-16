import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { PublicoObjetivoDatosResponse } from '@modules/activity-format/interface/target-audience';

@Injectable({ providedIn: 'root' })
export class TargetAudienceRepository {
  private readonly supabase = inject(SupabaseService);

  public listar(processId?: string | null): Observable<PublicoObjetivoDatosResponse> {
    return from(
      (async () => {
        let query = this.supabase.client
          .from('target_audiences')
          .select('id,name,description')
          .eq('is_active', true)
          .order('name');
        if (processId) query = query.eq('electoral_process_id', processId);
        const { data, error } = await query;
        if (error) throw error;
        return {
          datos: (data ?? []).map((row) => ({
            codigoPublicoObjetivo: row.id,
            nombre: row.name,
            descripcion: row.description ?? '',
          })),
        };
      })(),
    );
  }
}
