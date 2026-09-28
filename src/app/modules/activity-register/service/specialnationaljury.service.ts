import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { SpecialnationaljuryRepository } from '@modules/activity-register/repository/specialnationaljury.repository';
import {
  JuradoNacionalEspecialDatosResponse,
  JuradoNacionalEspecialResponse,
} from '@modules/activity-register/interface/specialnationaljury';

@Injectable({
  providedIn: 'root',
})
export class SpecialnationaljuryService {
  private readonly specialNationalJuryRepository: SpecialnationaljuryRepository = inject(
    SpecialnationaljuryRepository,
  );

  public select(processId?: string | null): Observable<AutoCompleteData[]> {
    return this.specialNationalJuryRepository.listar(processId).pipe(
      map((response: JuradoNacionalEspecialDatosResponse) => {
        return response.datos.map((specialNationalJury: JuradoNacionalEspecialResponse) => {
          return {
            key: specialNationalJury.codigoJuradoElectoral,
            value: specialNationalJury.nombreJuradoElectoral,
          };
        });
      }),
    );
  }
}
