import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { RegistroActividadParticipanteResponse } from '@modules/activity-register/interface/activity-register';
import { SupabaseService } from '@shared/service/supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ConsultRepository {
  private readonly supabaseService = inject(SupabaseService);
  private get client() {
    return this.supabaseService.client;
  }

  public consultarParticipante(
    numeroDocumento: string,
  ): Observable<RegistroActividadParticipanteResponse> {
    return from(
      (async () => {
        const { data, error } = await this.client
          .from('activity_participants')
          .select('dni,full_name,sex,age,organization,position,phone,email,population')
          .eq('dni', numeroDocumento)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          throw new Error('DNI sin antecedentes. Complete los datos del participante manualmente.');
        }

        return {
          dni: data.dni,
          nombresCompletos: data.full_name,
          sexo: data.sex ?? '',
          edad: data.age ?? 0,
          organizacion: data.organization ?? '',
          cargo: data.position ?? '',
          telefono: data.phone ?? '',
          correo: data.email ?? '',
          poblacion: data.population ?? '',
        };
      })(),
    );
  }
}
