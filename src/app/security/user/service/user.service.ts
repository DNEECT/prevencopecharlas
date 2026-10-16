import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { MensajeDatosResponse, MensajeResponse } from '@shared/interface/api.interface';
import { UserRepository } from '../repository/user.repository';
import {
  UsuarioDatosRequest,
  UsuarioDatosResponse,
  UsuarioPaginateResponse,
  UsuarioRequest,
  UsuarioResponse,
} from '../interface/user';
import { UsuarioPasswordDatosRequest, UsuarioPasswordRequest } from '../interface/user-password';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly userRepository: UserRepository = inject(UserRepository);

  public usuarioSubject = new BehaviorSubject<UsuarioResponse | null>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  constructor() {
    setTimeout(() => {
      this.cargarUsuario();
    }, 500);
  }

  public listar(
    numeroPagina: number,
    tamanioPagina: number,
    terminoBusqueda: string | null | undefined,
  ): Observable<UsuarioPaginateResponse> {
    return this.userRepository
      .listar(numeroPagina, tamanioPagina, terminoBusqueda)
      .pipe(map((response: UsuarioPaginateResponse) => response));
  }

  public select(): Observable<UsuarioResponse[]> {
    return this.userRepository
      .listar(null, null, null)
      .pipe(map((response: UsuarioPaginateResponse) => response.usuarios));
  }

  public obtener(codigoUsuario: string): Observable<UsuarioResponse> {
    return this.userRepository
      .obtener(codigoUsuario)
      .pipe(map((response: UsuarioDatosResponse) => response.datos));
  }

  public crear(request: UsuarioRequest): Observable<MensajeResponse> {
    const requestDatos: UsuarioDatosRequest = {
      datos: request,
    };
    return this.userRepository
      .crear(requestDatos)
      .pipe(map((response: MensajeDatosResponse) => response.datos));
  }

  public actualizar(request: UsuarioRequest, codigoUsuario: string): Observable<MensajeResponse> {
    const requestDatos: UsuarioDatosRequest = {
      datos: request,
    };
    return this.userRepository
      .actualizar(requestDatos, codigoUsuario)
      .pipe(map((response: MensajeDatosResponse) => response.datos));
  }

  public actualizarInfo(request: UsuarioPasswordRequest): Observable<MensajeResponse> {
    const requestDatos: UsuarioPasswordDatosRequest = {
      datos: request,
    };
    return this.userRepository
      .actualizarInfo(requestDatos)
      .pipe(map((response: MensajeDatosResponse) => response.datos));
  }

  public eliminar(codigoUsuario: string): Observable<MensajeResponse> {
    return this.userRepository
      .eliminar(codigoUsuario)
      .pipe(map((response: MensajeDatosResponse) => response.datos));
  }

  private cargarUsuario() {
    this.obtenerUsuario().subscribe((usuario) => {
      this.usuarioSubject.next(usuario);
    });
  }

  public obtenerUsuario(): Observable<UsuarioResponse> {
    return this.userRepository
      .obtenerUsuario()
      .pipe(map((response: UsuarioDatosResponse) => response.datos));
  }
}
