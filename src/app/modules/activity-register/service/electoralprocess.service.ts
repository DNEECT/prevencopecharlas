import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { ElectoralprocessRepository } from '@modules/activity-register/repository/electoralprocess.repository';
import {
  ProcesoElectoralDatosResponse,
  ProcesoElectoralResponse,
} from '@modules/activity-register/interface/electoralprocess';

@Injectable({
  providedIn: 'root',
})
export class ElectoralprocessService {
  private readonly electoralprocessRepostory: ElectoralprocessRepository = inject(
    ElectoralprocessRepository,
  );

  public select(): Observable<AutoCompleteData[]> {
    return this.electoralprocessRepostory.listar().pipe(
      map((response: ProcesoElectoralDatosResponse) => {
        return response.datos.map((tipoActividad: ProcesoElectoralResponse) => {
          return {
            key: tipoActividad.codigoProcesoElectoral,
            value: tipoActividad.nombre,
          };
        });
      }),
    );
  }
}
