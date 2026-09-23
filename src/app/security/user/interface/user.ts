import { MenuItems } from '@shared/interface/header-table.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { RolResponse } from './role';

export interface UsuarioPaginateResponse {
  usuarios: UsuarioResponse[];
  totalElementos: number;
  numeroPagina: number;
  tamanioPagina: number;
}

export interface UsuarioDatosResponse {
  datos: UsuarioResponse;
}

export interface UsuarioResponse {
  codigoUsuario: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  username: string;
  correo: string;
  direccion: string;
  fechaNacimiento: string;
  roles: RolResponse[];
  estado: boolean;
}

export interface UsuarioDatosRequest {
  datos: UsuarioRequest;
}

export interface UsuarioRequest {
  numeroDocumento: string | null | undefined;
  nombres: string | null | undefined;
  apellidos: string | null | undefined;
  username: string | null | undefined;
  correo: string | null | undefined;
  direccion: string | null | undefined;
  fechaNacimiento: string | null | undefined;
  roles: string[];
}

// interfaces de las vistas
export interface UsuarioResponseTable extends UsuarioResponse {
  opciones: MenuItems[];
}

// formularios
export interface UsuarioFormDto {
  numeroDocumento: string | null | undefined;
  nombres: string | null | undefined;
  apellidos: string | null | undefined;
  username: string | null | undefined;
  correo: string | null | undefined;
  direccion: string | null | undefined;
  fechaNacimiento: string | null | undefined;
  roles: AutoCompleteData[] | null;
}

export interface UsuarioForm {
  numeroDocumento: FormControl<string | null>;
  nombres: FormControl<string | null>;
  apellidos: FormControl<string | null>;
  username: FormControl<string | null>;
  correo: FormControl<string | null>;
  direccion: FormControl<string | null>;
  fechaNacimiento: FormControl<string | null>;
  roles: FormControl<AutoCompleteData[] | null>;
}

// inicializar formulario y mensajes
export const usuarioFormGroup: FormGroup<UsuarioForm> = new FormGroup<UsuarioForm>({
  numeroDocumento: new FormControl<string>('', {
    validators: [Validators.required, Validators.maxLength(20)],
  }),
  nombres: new FormControl<string>('', {
    validators: [Validators.required, Validators.maxLength(100)],
  }),
  apellidos: new FormControl<string>('', {
    validators: [Validators.required, Validators.maxLength(100)],
  }),
  username: new FormControl<string>('', {
    validators: [Validators.required, Validators.maxLength(20)],
  }),
  correo: new FormControl<string>('', {
    validators: [Validators.required, Validators.maxLength(100), Validators.email],
  }),
  direccion: new FormControl<string>('', {
    validators: [Validators.required, Validators.maxLength(100)],
  }),
  fechaNacimiento: new FormControl<string>('', {
    validators: [Validators.required],
  }),
  roles: new FormControl<AutoCompleteData[] | null>(null, {
    validators: [Validators.required],
  }),
});

export const errorMessagesUsuarioForm: ErrorFields = {
  numeroDocumento: [
    { required: 'El número de documento es obligatorio.' },
    { maxlength: 'El máximo de caracteres permitidos es 20.' },
  ],
  nombres: [
    { required: 'Los nombres son obligatorios.' },
    { maxlength: 'El máximo de caracteres permitidos es 100.' },
  ],
  apellidos: [
    { required: 'Los apellidos son obligatorios.' },
    { maxlength: 'El máximo de caracteres permitidos es 100.' },
  ],
  username: [
    { required: 'El nombre de usuario es obligatorio.' },
    { maxlength: 'El máximo de caracteres permitidos es 20.' },
  ],
  correo: [
    { required: 'El correo electrónico es obligatorio.' },
    { maxlength: 'El máximo de caracteres permitidos es 100.' },
    { email: 'El correo no tiene un formato válido.' },
  ],
  direccion: [
    { required: 'La dirección es obligatoria.' },
    { maxlength: 'El máximo de caracteres permitidos es 100.' },
  ],
  fechaNacimiento: [{ required: 'La fecha de nacimiento es obligatoria.' }],
  roles: [{ required: 'Seleccione al menos un rol.' }],
};

export function convertirUsuarioFormDtoToUsuarioRequest(
  usuarioFormDto: FormGroup<UsuarioForm>,
): UsuarioRequest {
  return {
    numeroDocumento: usuarioFormDto.value.numeroDocumento ?? null,
    nombres: usuarioFormDto.value.nombres ?? null,
    apellidos: usuarioFormDto.value.apellidos ?? null,
    username: usuarioFormDto.value.username ?? null,
    correo: usuarioFormDto.value.correo ?? null,
    direccion: usuarioFormDto.value.direccion ?? null,
    fechaNacimiento: usuarioFormDto.value.fechaNacimiento ?? null,
    roles: usuarioFormDto.value.roles ? usuarioFormDto.value.roles.map((r) => r.key) : [],
  };
}

export function convertirUsuarioResponseToUsuarioFormDto(
  usuarioResponse: UsuarioResponse,
): UsuarioFormDto {
  return {
    numeroDocumento: usuarioResponse.numeroDocumento ?? null,
    nombres: usuarioResponse.nombres ?? null,
    apellidos: usuarioResponse.apellidos ?? null,
    username: usuarioResponse.username ?? null,
    correo: usuarioResponse.correo ?? null,
    direccion: usuarioResponse.direccion ?? null,
    fechaNacimiento: usuarioResponse.fechaNacimiento ?? null,
    roles: usuarioResponse.roles
      ? usuarioResponse.roles.map((r) => ({ key: r.codigoRol, value: r.nombre }))
      : [],
  };
}
