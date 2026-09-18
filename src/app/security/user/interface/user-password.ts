// inicializar formulario y mensajes
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { UsuarioRequest } from './user';

export interface UsuarioPasswordForm {
  numeroDocumento: FormControl<string | null>;
  nombres: FormControl<string | null>;
  apellidos: FormControl<string | null>;
  username: FormControl<string | null>;
  correo: FormControl<string | null>;
  direccion: FormControl<string | null>;
  fechaNacimiento: FormControl<string | null>;
  contraseniaOld: FormControl<string | null>;
  contraseniaNew: FormControl<string | null>;
  contraseniaConfirm: FormControl<string | null>;
  roles: FormControl<AutoCompleteData[] | null>;
}

export const usuarioPasswordFormGroup: FormGroup<UsuarioPasswordForm> =
  new FormGroup<UsuarioPasswordForm>({
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
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    correo: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(100), Validators.email],
    }),
    direccion: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(250)],
    }),
    fechaNacimiento: new FormControl<string>('', {
      validators: [Validators.required],
    }),
    contraseniaOld: new FormControl<string>('', {
      validators: [Validators.minLength(8), Validators.maxLength(100)],
    }),
    contraseniaNew: new FormControl<string>('', {
      validators: [Validators.minLength(8), Validators.maxLength(100)],
    }),
    contraseniaConfirm: new FormControl<string>('', {
      validators: [Validators.minLength(8), Validators.maxLength(100)],
    }),
    roles: new FormControl<AutoCompleteData[] | null>(null, {
      validators: [Validators.required],
    }),
  });

export const errorMessagesUsuarioPasswordForm: ErrorFields = {
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
    { maxlength: 'El máximo de caracteres permitidos es 50.' },
  ],
  correo: [
    { required: 'El correo electrónico es obligatorio.' },
    { maxlength: 'El máximo de caracteres permitidos es 100.' },
    { email: 'El correo no tiene un formato válido.' },
  ],
  direccion: [
    { required: 'La dirección es obligatoria.' },
    { maxlength: 'El máximo de caracteres permitidos es 250.' },
  ],
  fechaNacimiento: [{ required: 'La fecha de nacimiento es obligatoria.' }],
  contraseniaOld: [{ required: 'La contraseña anterior es obligatoria.' }],
  contraseniaNew: [
    { required: 'La contraseña nueva es obligatoria.' },
    { minlength: 'La contraseña debe tener al menos 8 caracteres.' },
    { maxlength: 'El máximo de caracteres permitidos es 100.' },
  ],
  contraseniaConfirm: [
    { required: 'La confirmación de la contraseña es obligatoria.' },
    { minlength: 'La contraseña debe tener al menos 8 caracteres.' },
    { maxlength: 'El máximo de caracteres permitidos es 100.' },
  ],
  roles: [{ required: 'Seleccione al menos un rol.' }],
};

// Interface TypeScript equivalente al record Java `UsuarioPasswordRequest`
export interface UsuarioPasswordRequest {
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  contraseniaOld: string;
  contraseniaNueva: string;
  contraseniaNuevaConfirm: string;
  direccion?: string | null;
  fechaNacimiento?: string | null;
}

export interface UsuarioPasswordDatosRequest {
  datos: UsuarioPasswordRequest;
}

/**
 * Helper que construye un `UsuarioPasswordRequest` desde el FormGroup `UsuarioPasswordForm`.
 * Normaliza valores vacíos a cadenas vacías o null según el campo.
 */
type RawUsuarioPasswordFormValue = {
  numeroDocumento: string | null;
  nombres: string | null;
  apellidos: string | null;
  username: string | null;
  correo: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  contraseniaOld: string | null;
  contraseniaNew: string | null;
  contraseniaConfirm: string | null;
  roles: AutoCompleteData[] | null;
};

export function buildUsuarioPasswordRequestFromForm(
  form: FormGroup<UsuarioPasswordForm>,
): UsuarioPasswordRequest {
  const value = form.getRawValue() as RawUsuarioPasswordFormValue;

  return {
    numeroDocumento: (value.numeroDocumento ?? '').toString(),
    nombres: (value.nombres ?? '').toString(),
    apellidos: (value.apellidos ?? '').toString(),
    contraseniaOld: (value.contraseniaOld ?? '').toString(),
    contraseniaNueva: (value.contraseniaNew ?? '').toString(),
    contraseniaNuevaConfirm: (value.contraseniaConfirm ?? '').toString(),
    direccion: value.direccion ?? null,
    fechaNacimiento: value.fechaNacimiento ?? null,
  };
}
