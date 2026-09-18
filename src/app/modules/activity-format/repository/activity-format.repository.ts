import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import {
  CodigoRegistroActividadResonse,
  FormatoActividadDatosRequest,
  FormatoActividadDatosResponse,
  FormatoActividadPaginateResponse,
} from '@modules/activity-format/interface/activity-format';
import { MensajeDatosResponse } from '@shared/interface/api.interface';

@Injectable({
  providedIn: 'root',
})
export class ActivityFormatRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriFormatoActividad = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.FORMATO_ACTIVIDADES}`;

  public listar(
    numeroPagina: number | null,
    tamanioPagina: number | null,
  ): Observable<FormatoActividadPaginateResponse> {
    if (numeroPagina === null || tamanioPagina === null) {
      return this.apiService.get(`${this.uriFormatoActividad}`, {}, {}, {}, true);
    }

    return this.apiService.get(`${this.uriFormatoActividad}`, {
      numeroPagina,
      tamanioPagina,
    });
  }

  public obtener(codigoFormatoActividad: string): Observable<FormatoActividadDatosResponse> {
    return this.apiService.get(`${this.uriFormatoActividad}/${codigoFormatoActividad}`);
  }

  public consultarCodigoSiguiente(
    codigoTipoActividad: string,
    tema: string
  ): Observable<CodigoRegistroActividadResonse> {
    return this.apiService.get(`${this.uriFormatoActividad}/generar-codigo`, {
      codigoTipoActividad,
      tema
    });
  }

  public crear(request: FormatoActividadDatosRequest): Observable<MensajeDatosResponse> {
    return this.apiService.post(`${this.uriFormatoActividad}`, request);
  }

  public actualizar(
    request: FormatoActividadDatosRequest,
    codigoFormatoActividad: string,
  ): Observable<MensajeDatosResponse> {
    return this.apiService.put(`${this.uriFormatoActividad}/${codigoFormatoActividad}`, request);
  }

  public eliminar(codigoFormatoActividad: string): Observable<void> {
    return this.apiService.delete(`${this.uriFormatoActividad}/${codigoFormatoActividad}`);
  }
}
