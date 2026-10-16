import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { AccionesResponse } from '../../permission/interface/permission';

export interface LoginRequest {
  usuario: string | null | undefined;
  contrasenia: string | null | undefined;
}

export interface LoginDatosRequest {
  datos: LoginRequest;
}

export interface LoginResponse {
  pathDefault: string;
}

export interface LoginDatosResponse {
  datos: LoginResponse;
}

export interface MenuItemResponse {
  title: string;
  abreviatura?: string;
  icon?: string;
  link?: string;
  order?: number | null;
  isVisible?: boolean | null;
  items?: MenuItemResponse[];
  permisos?: AccionesResponse[];
  active?: boolean;
}

export interface MenuItemDatosRespone {
  datos: MenuItemResponse[];
}

// formularios
export interface LoginForm {
  usuario: FormControl<string | null>;
  contrasenia: FormControl<string | null>;
}

// inicializar formulario y mensajes
export const loginFormGroup: FormGroup<LoginForm> = new FormGroup<LoginForm>({
  usuario: new FormControl<string>('', {
    validators: [Validators.required, Validators.email, Validators.maxLength(100)],
  }),
  contrasenia: new FormControl<string>('', {
    validators: [Validators.required, Validators.minLength(8)],
  }),
});

export const errorMessagesLoginForm: ErrorFields = {
  usuario: [
    { required: 'El correo es obligatorio.' },
    { email: 'Ingrese un correo válido.' },
    { maxlength: 'El máximo de caracteres es 100.' },
  ],
  contrasenia: [
    { required: 'Contrasenia es un dato obligatorio.' },
    { minlength: 'El minimo de caracteres es 8.' },
  ],
};
