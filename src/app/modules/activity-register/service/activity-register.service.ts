import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  RegistroActividadDatosRequest,
  RegistroActividadDatosResponse,
  RegistroActividadPaginateResponse,
  RegistroActividadRequest,
  RegistroActividadResponse,
} from '@modules/activity-register/interface/activity-register';
import { MensajeDatosResponse, MensajeResponse } from '@shared/interface/api.interface';
import { ActivityRegisterRepository } from '@modules/activity-register/repository/activity-register.repository';

@Injectable({
  providedIn: 'root',
})
export class ActivityRegisterService {
  private readonly activityRegisterRepository: ActivityRegisterRepository = inject(
    ActivityRegisterRepository,
  );

  public listar(
    numeroPagina: number | null,
    tamanioPagina: number | null,
    codJuradoNacionalEspecial: string | null | undefined,
    terminoBusqueda: string | null | undefined,
  ): Observable<RegistroActividadPaginateResponse> {
    return this.activityRegisterRepository
      .listar(numeroPagina, tamanioPagina, codJuradoNacionalEspecial, terminoBusqueda)
      .pipe(map((response: RegistroActividadPaginateResponse) => response));
  }

  public select(): Observable<RegistroActividadResponse[]> {
    return this.activityRegisterRepository
      .listar(null, null, null, null)
      .pipe(map((response: RegistroActividadPaginateResponse) => response.registroActividades));
  }

  public obtener(codigoRegistroActividad: string): Observable<RegistroActividadResponse> {
    return this.activityRegisterRepository
      .obtener(codigoRegistroActividad)
      .pipe(map((response: RegistroActividadDatosResponse) => response.datos));
  }

  public crear(request: RegistroActividadRequest): Observable<MensajeResponse> {
    const requestDatos: RegistroActividadDatosRequest = {
      datos: request,
    };
    return this.activityRegisterRepository
      .crear(requestDatos)
      .pipe(map((response: MensajeDatosResponse) => response.datos));
  }

  public actualizar(
    request: RegistroActividadRequest,
    codigoRegistroActividad: string,
  ): Observable<MensajeResponse> {
    const requestDatos: RegistroActividadDatosRequest = {
      datos: request,
    };
    return this.activityRegisterRepository
      .actualizar(requestDatos, codigoRegistroActividad)
      .pipe(map((response: MensajeDatosResponse) => response.datos));
  }

  public eliminar(codigoRegistroActividad: string): Observable<void> {
    return this.activityRegisterRepository
      .eliminar(codigoRegistroActividad)
      .pipe(map((response: void) => response));
  }
}
