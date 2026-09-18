import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import {
  TipoActividadDatosRequest,
  TipoActividadDatosResponse,
  TipoActividadPaginateResponse,
} from '@modules/activity-type/interface/activity-type';
import { Observable } from 'rxjs';
import { MensajeDatosResponse } from '@shared/interface/api.interface';

@Injectable({
  providedIn: 'root',
})
export class ActivityTypeRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriTipoActividad = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.TIPO_ACTIVIDADES}`;

  public listar(
    numeroPagina: number | null,
    tamanioPagina: number | null,
  ): Observable<TipoActividadPaginateResponse> {
    if (numeroPagina === null || tamanioPagina === null) {
      return this.apiService.get(`${this.uriTipoActividad}`, {}, {}, {}, true);
    }

    return this.apiService.get(`${this.uriTipoActividad}`, {
      numeroPagina,
      tamanioPagina,
    });
  }

  public obtener(codigoTipoActividad: string): Observable<TipoActividadDatosResponse> {
    return this.apiService.get(`${this.uriTipoActividad}/${codigoTipoActividad}`);
  }

  public crear(request: TipoActividadDatosRequest): Observable<MensajeDatosResponse> {
    return this.apiService.post(`${this.uriTipoActividad}`, request);
  }

  public actualizar(
    request: TipoActividadDatosRequest,
    codigoTipoActividad: string,
  ): Observable<MensajeDatosResponse> {
    return this.apiService.put(`${this.uriTipoActividad}/${codigoTipoActividad}`, request);
  }

  public eliminar(codigoTipoActividad: string): Observable<void> {
    return this.apiService.delete(`${this.uriTipoActividad}/${codigoTipoActividad}`);
  }
}
