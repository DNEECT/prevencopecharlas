import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import { MensajeDatosResponse } from '@shared/interface/api.interface';
import {
  UsuarioDatosRequest,
  UsuarioDatosResponse,
  UsuarioPaginateResponse,
} from '../interface/user';
import { UsuarioPasswordDatosRequest } from '../interface/user-password';

@Injectable({
  providedIn: 'root',
})
export class UserRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriUsuario = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.USUARIO}`;

  public listar(
    numeroPagina: number | null,
    tamanioPagina: number | null,
    terminoBusqueda: string | null | undefined,
  ): Observable<UsuarioPaginateResponse> {
    if (numeroPagina === null || tamanioPagina === null) {
      return this.apiService.get(`${this.uriUsuario}`, {}, {}, {}, true);
    }

    const params: any = {
      numeroPagina,
      tamanioPagina,
    };

    if (terminoBusqueda) {
      params.terminoBusqueda = terminoBusqueda;
    }

    return this.apiService.get(`${this.uriUsuario}`, params);
  }

  public obtener(codigoUsuario: string): Observable<UsuarioDatosResponse> {
    return this.apiService.get(`${this.uriUsuario}/${codigoUsuario}`);
  }

  obtenerUsuario(): Observable<UsuarioDatosResponse> {
    return this.apiService.get(`${this.uriUsuario}/obtener-info`);
  }

  public crear(request: UsuarioDatosRequest): Observable<MensajeDatosResponse> {
    return this.apiService.post(`${this.uriUsuario}`, request);
  }

  public actualizar(
    request: UsuarioDatosRequest,
    codigoUsuario: string,
  ): Observable<MensajeDatosResponse> {
    return this.apiService.put(`${this.uriUsuario}/${codigoUsuario}`, request);
  }

  public actualizarInfo(request: UsuarioPasswordDatosRequest): Observable<MensajeDatosResponse> {
    return this.apiService.put(`${this.uriUsuario}/actualizar-info`, request);
  }

  public eliminar(codigoUsuario: string): Observable<void> {
    return this.apiService.delete(`${this.uriUsuario}/${codigoUsuario}`);
  }
}
