import { inject, Injectable } from '@angular/core';
import { ActivityTypeRepository } from '@modules/activity-type/repository/activity-type.repository';
import { map, Observable } from 'rxjs';
import {
  TipoActividadDatosRequest,
  TipoActividadDatosResponse,
  TipoActividadPaginateResponse,
  TipoActividadRequest,
  TipoActividadResponse,
} from '@modules/activity-type/interface/activity-type';
import { MensajeDatosResponse, MensajeResponse } from '@shared/interface/api.interface';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';

@Injectable({
  providedIn: 'root',
})
export class ActivityTypeService {
  private readonly activityTypeRepository: ActivityTypeRepository = inject(ActivityTypeRepository);

  public listar(
    numeroPagina: number,
    tamanioPagina: number,
  ): Observable<TipoActividadPaginateResponse> {
    return this.activityTypeRepository
      .listar(numeroPagina, tamanioPagina)
      .pipe(map((response: TipoActividadPaginateResponse) => response));
  }

  public select(): Observable<AutoCompleteData[]> {
    return this.activityTypeRepository.listar(null, null).pipe(
      map((response: TipoActividadPaginateResponse) => {
        return response.tiposActividades.map((tipoActividad: TipoActividadResponse) => {
          return {
            key: tipoActividad.codigoTipoActividad,
            value: tipoActividad.nombre,
          };
        });
      }),
    );
  }

  public obtener(codigoTipoActividad: string): Observable<TipoActividadResponse> {
    return this.activityTypeRepository
      .obtener(codigoTipoActividad)
      .pipe(map((response: TipoActividadDatosResponse) => response.datos));
  }

  public crear(request: TipoActividadRequest): Observable<MensajeResponse> {
    const requestDatos: TipoActividadDatosRequest = {
      datos: request,
    };
    return this.activityTypeRepository
      .crear(requestDatos)
      .pipe(map((response: MensajeDatosResponse) => response.datos));
  }

  public actualizar(
    request: TipoActividadRequest,
    codigoTipoActividad: string,
  ): Observable<MensajeResponse> {
    const requestDatos: TipoActividadDatosRequest = {
      datos: request,
    };
    return this.activityTypeRepository
      .actualizar(requestDatos, codigoTipoActividad)
      .pipe(map((response: MensajeDatosResponse) => response.datos));
  }

  public eliminar(codigoTipoActividad: string): Observable<void> {
    return this.activityTypeRepository
      .eliminar(codigoTipoActividad)
      .pipe(map((response: void) => response));
  }
}
