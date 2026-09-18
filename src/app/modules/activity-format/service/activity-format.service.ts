import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CodigoRegistroActividadResonse,
  FormatoActividadDatosRequest,
  FormatoActividadDatosResponse,
  FormatoActividadPaginateResponse,
  FormatoActividadRequest,
  FormatoActividadResponse,
} from '@modules/activity-format/interface/activity-format';
import { MensajeDatosResponse, MensajeResponse } from '@shared/interface/api.interface';
import { ActivityFormatRepository } from '@modules/activity-format/repository/activity-format.repository';

@Injectable({
  providedIn: 'root',
})
export class ActivityFormatService {
  private readonly activityFormatRepository: ActivityFormatRepository =
    inject(ActivityFormatRepository);

  public listar(
    numeroPagina: number,
    tamanioPagina: number,
  ): Observable<FormatoActividadPaginateResponse> {
    return this.activityFormatRepository
      .listar(numeroPagina, tamanioPagina)
      .pipe(map((response: FormatoActividadPaginateResponse) => response));
  }

  public select(): Observable<FormatoActividadResponse[]> {
    return this.activityFormatRepository
      .listar(null, null)
      .pipe(map((response: FormatoActividadPaginateResponse) => response.formatosActividades));
  }

  public obtener(codigoFormatoActividad: string): Observable<FormatoActividadResponse> {
    return this.activityFormatRepository
      .obtener(codigoFormatoActividad)
      .pipe(map((response: FormatoActividadDatosResponse) => response.datos));
  }

  public consultarCodigoSiguiente(
    codigoTipoActividad: string,
    tema: string
  ): Observable<string> {
    return this.activityFormatRepository
      .consultarCodigoSiguiente(
        codigoTipoActividad,
        tema
      )
      .pipe(map((response: CodigoRegistroActividadResonse) => response.datos));
  }

  public crear(request: FormatoActividadRequest): Observable<MensajeResponse> {
    const requestDatos: FormatoActividadDatosRequest = {
      datos: request,
    };
    return this.activityFormatRepository
      .crear(requestDatos)
      .pipe(map((response: MensajeDatosResponse) => response.datos));
  }

  public actualizar(
    request: FormatoActividadRequest,
    codigoFormatoActividad: string,
  ): Observable<MensajeResponse> {
    const requestDatos: FormatoActividadDatosRequest = {
      datos: request,
    };
    return this.activityFormatRepository
      .actualizar(requestDatos, codigoFormatoActividad)
      .pipe(map((response: MensajeDatosResponse) => response.datos));
  }

  public eliminar(codigoFormatoActividad: string): Observable<void> {
    return this.activityFormatRepository
      .eliminar(codigoFormatoActividad)
      .pipe(map((response: void) => response));
  }
}
