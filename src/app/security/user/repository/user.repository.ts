import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { MensajeDatosResponse } from '@shared/interface/api.interface';
import {
  UsuarioDatosRequest,
  UsuarioDatosResponse,
  UsuarioPaginateResponse,
} from '../interface/user';
import { UsuarioPasswordDatosRequest } from '../interface/user-password';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { UsuarioResponse } from '../interface/user';

@Injectable({
  providedIn: 'root',
})
export class UserRepository {
  private readonly supabaseService = inject(SupabaseService);
  private get supabase() {
    return this.supabaseService.client;
  }

  public listar(
    numeroPagina: number | null,
    tamanioPagina: number | null,
    terminoBusqueda: string | null | undefined,
  ): Observable<UsuarioPaginateResponse> {
    return from(
      this.supabaseService.invoke<UsuarioPaginateResponse>('admin-directory', {
        action: 'list-users',
        page: numeroPagina ?? 0,
        pageSize: tamanioPagina ?? 1000,
        search: terminoBusqueda?.trim() || null,
      }),
    );
  }

  public obtener(codigoUsuario: string): Observable<UsuarioDatosResponse> {
    return from(
      this.supabaseService.invoke<UsuarioDatosResponse>('admin-directory', {
        action: 'get-user',
        userId: codigoUsuario,
      }),
    );
  }

  obtenerUsuario(): Observable<UsuarioDatosResponse> {
    return from(this.loadCurrentUser());
  }

  private async loadCurrentUser(): Promise<UsuarioDatosResponse> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();
    if (authError || !user) throw authError ?? new Error('No hay una sesión activa');
    const [{ data: profile, error }, { data: roles, error: roleError }] = await Promise.all([
      this.supabase.from('profiles').select('*').eq('id', user.id).eq('is_active', true).single(),
      this.supabase.rpc('my_roles'),
    ]);
    if (error || !profile || roleError) throw error ?? roleError ?? new Error('Perfil inactivo');
    const datos: UsuarioResponse = {
      codigoUsuario: profile.id,
      numeroDocumento: profile.document_number ?? '',
      nombres: profile.first_names,
      apellidos: profile.last_names,
      username: profile.username,
      correo: profile.email,
      direccion: profile.address ?? '',
      fechaNacimiento: profile.birth_date ?? '',
      roles: (roles ?? []).map(
        (role: { id: string; name: string; description: string | null }) => ({
          codigoRol: role.id,
          nombre: role.name,
          descripcion: role.description ?? '',
        }),
      ),
      estado: profile.is_active,
    };
    return { datos };
  }

  public crear(request: UsuarioDatosRequest): Observable<MensajeDatosResponse> {
    return from(
      this.supabaseService.invoke<MensajeDatosResponse>('admin-directory', {
        action: 'create-user',
        user: request.datos,
      }),
    );
  }

  public actualizar(
    request: UsuarioDatosRequest,
    codigoUsuario: string,
  ): Observable<MensajeDatosResponse> {
    return from(
      this.supabaseService.invoke<MensajeDatosResponse>('admin-directory', {
        action: 'update-user',
        userId: codigoUsuario,
        user: request.datos,
      }),
    );
  }

  public actualizarInfo(request: UsuarioPasswordDatosRequest): Observable<MensajeDatosResponse> {
    return from(this.updateCurrentUser(request));
  }

  private async updateCurrentUser(
    request: UsuarioPasswordDatosRequest,
  ): Promise<MensajeDatosResponse> {
    const input = request.datos;
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();
    if (authError || !user) throw authError ?? new Error('No hay una sesión activa');
    if (input.contraseniaNueva || input.contraseniaOld || input.contraseniaNuevaConfirm) {
      if (
        !input.contraseniaOld ||
        input.contraseniaNueva.length < 8 ||
        input.contraseniaNueva !== input.contraseniaNuevaConfirm
      ) {
        throw new Error('Verifique la contraseña actual y la confirmación de la nueva contraseña.');
      }
      const { error } = await this.supabase.auth.signInWithPassword({
        email: user.email ?? '',
        password: input.contraseniaOld,
      });
      if (error) throw new Error('La contraseña actual es incorrecta.');
      const { error: passwordError } = await this.supabase.auth.updateUser({
        password: input.contraseniaNueva,
      });
      if (passwordError) throw passwordError;
    }
    const { error: profileError } = await this.supabase
      .from('profiles')
      .update({
        document_number: input.numeroDocumento,
        first_names: input.nombres,
        last_names: input.apellidos,
        address: input.direccion,
        birth_date: input.fechaNacimiento || null,
      })
      .eq('id', user.id);
    if (profileError) throw profileError;
    return { datos: { codigo: 'OK', mensaje: 'Perfil actualizado' } };
  }

  public eliminar(codigoUsuario: string): Observable<MensajeDatosResponse> {
    return from(
      this.supabaseService.invoke<MensajeDatosResponse>('admin-directory', {
        action: 'toggle-user',
        userId: codigoUsuario,
      }),
    );
  }
}
