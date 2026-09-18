import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  PublicoObjetivoDatosResponse,
  PublicoObjetivoResponse,
} from '@modules/activity-format/interface/target-audience';
import { TargetAudienceRepository } from '@modules/activity-format/repository/target-audience.repository';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';

@Injectable({
  providedIn: 'root',
})
export class TargetAudienceService {
  private readonly targetAudienceRepository: TargetAudienceRepository =
    inject(TargetAudienceRepository);

  public select(): Observable<AutoCompleteData[]> {
    return this.targetAudienceRepository.listar().pipe(
      map((response: PublicoObjetivoDatosResponse) => {
        return response.datos.map((tipoActividad: PublicoObjetivoResponse) => {
          return {
            key: tipoActividad.codigoPublicoObjetivo,
            value: tipoActividad.nombre,
          };
        });
      }),
    );
  }
}
