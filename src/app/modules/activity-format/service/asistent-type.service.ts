import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AsistentTypeRepository } from '@modules/activity-format/repository/asistent-type.repository';
import {
  TipoAsistenteDatosResponse,
  TipoAsistenteResponse,
} from '@modules/activity-format/interface/asistent-type';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';

@Injectable({
  providedIn: 'root',
})
export class AsistentTypeService {
  private readonly asistentTypeRepostory: AsistentTypeRepository = inject(AsistentTypeRepository);

  public select(): Observable<AutoCompleteData[]> {
    return this.asistentTypeRepostory.listar().pipe(
      map((response: TipoAsistenteDatosResponse) => {
        return response.datos.map((tipoActividad: TipoAsistenteResponse) => {
          return {
            key: tipoActividad.codigoTipoAsistente,
            value: tipoActividad.nombre,
          };
        });
      }),
    );
  }
}
