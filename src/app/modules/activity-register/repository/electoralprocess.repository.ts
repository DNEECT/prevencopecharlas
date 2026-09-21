import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { ProcesoElectoralDatosResponse } from '@modules/activity-register/interface/electoralprocess';

@Injectable({ providedIn: 'root' })
export class ElectoralprocessRepository {
  private readonly supabase = inject(SupabaseService);

  public listar(): Observable<ProcesoElectoralDatosResponse> {
    return from((async () => {
      const { data, error } = await this.supabase.client.from('electoral_processes')
        .select('id,name,description').eq('is_active', true).order('name');
      if (error) throw error;
      return { datos: (data ?? []).map((row) => ({
        codigoProcesoElectoral: row.id, nombre: row.name, descripcion: row.description ?? '',
      })) };
    })());
  }
}
