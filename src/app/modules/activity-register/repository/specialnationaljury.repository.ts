import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { JuradoNacionalEspecialDatosResponse } from '@modules/activity-register/interface/specialnationaljury';

@Injectable({ providedIn: 'root' })
export class SpecialnationaljuryRepository {
  private readonly supabase = inject(SupabaseService);

  public listar(): Observable<JuradoNacionalEspecialDatosResponse> {
    return from((async () => {
      const { data, error } = await this.supabase.client.from('special_juries').select('*')
        .eq('is_active', true).order('jury_name');
      if (error) throw error;
      return { datos: (data ?? []).map((row) => ({
        codigoJuradoElectoral: row.id,
        codJuradoElectoral: row.jury_code ?? 0,
        nombreJuradoElectoral: row.jury_name,
        direccion: row.address,
        telefono: row.phone,
        codProcesoElectoral: row.source_process_code,
        feApertura: row.opened_on,
        feCierreJurisdiccional: row.jurisdiction_closed_on,
        feCierreAdministrativo: row.administratively_closed_on,
        actaCierre: row.closure_record,
        siglas: row.initials,
        horarioAtencion: row.office_hours,
        ubigeo: row.ubigeo,
        departamento: row.department,
        provincia: row.province,
        codEstado: row.source_status_code?.toString() ?? null,
        codParamCerrado: row.source_closed_parameter,
      })) };
    })());
  }
}
