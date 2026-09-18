import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import {
  RegistroActividadDatosRequest,
  RegistroActividadDatosResponse,
  RegistroActividadPaginateResponse,
} from '@modules/activity-register/interface/activity-register';
import { MensajeDatosResponse } from '@shared/interface/api.interface';

@Injectable({
  providedIn: 'root',
})
export class ActivityRegisterRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriRegistroActividad = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.REGISTRO_ACTIVIDADES}`;

  public listar(
    numeroPagina: number | null,
    tamanioPagina: number | null,
    codJuradoNacionalEspecial: string | null | undefined,
    terminoBusqueda: string | null | undefined,
  ): Observable<RegistroActividadPaginateResponse> {
    const params: Record<string, any> = {};

    if (numeroPagina !== null && tamanioPagina !== null) {
      params['numeroPagina'] = numeroPagina;
      params['tamanioPagina'] = tamanioPagina;
    }

    if (codJuradoNacionalEspecial) {
      params['codJuradoNacionalEspecial'] = codJuradoNacionalEspecial;
    }

    if (terminoBusqueda) {
      params['terminoBusqueda'] = terminoBusqueda;
    }

    if (numeroPagina === null || tamanioPagina === null) {
      return this.apiService.get(`${this.uriRegistroActividad}`, params, {}, {}, true);
    }

    return this.apiService.get(`${this.uriRegistroActividad}`, params);
  }

  public obtener(codigoRegistroActividad: string): Observable<RegistroActividadDatosResponse> {
    return this.apiService.get(`${this.uriRegistroActividad}/${codigoRegistroActividad}`);
  }

  public crear(request: RegistroActividadDatosRequest): Observable<MensajeDatosResponse> {
    return this.apiService.post(`${this.uriRegistroActividad}`, request);
  }

  public actualizar(
    request: RegistroActividadDatosRequest,
    codigoRegistroActividad: string,
  ): Observable<MensajeDatosResponse> {
    return this.apiService.put(`${this.uriRegistroActividad}/${codigoRegistroActividad}`, request);
  }

  public eliminar(codigoRegistroActividad: string): Observable<void> {
    return this.apiService.delete(`${this.uriRegistroActividad}/${codigoRegistroActividad}`);
  }
}
