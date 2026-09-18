import { MenuItems } from '@shared/interface/header-table.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';

export interface TipoActividadPaginateResponse {
  tiposActividades: TipoActividadResponse[];
  totalElementos: number;
  numeroPagina: number;
  tamanioPagina: number;
}

export interface TipoActividadDatosResponse {
  datos: TipoActividadResponse;
}

export interface TipoActividadResponse {
  codigoTipoActividad: string;
  nombre: string;
  descripcion: string;
}

export interface TipoActividadDatosRequest {
  datos: TipoActividadRequest;
}

export interface TipoActividadRequest {
  nombre: string | null | undefined;
  descripcion: string | null | undefined;
}

// interfaces de las vistas
export interface TipoActividadResponseTable extends TipoActividadResponse {
  opciones: MenuItems[];
}

// formularios
export interface TipoActividadFormDto {
  nombre: string | null | undefined;
  descripcion: string | null | undefined;
}

export interface TipoActividadForm {
  nombre: FormControl<string | null>;
  descripcion: FormControl<string | null>;
}

// inicializar formulario y mensajes
export const tipoActividadFormGroup: FormGroup<TipoActividadForm> =
  new FormGroup<TipoActividadForm>({
    nombre: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    descripcion: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(250)],
    }),
  });

export const errorMessagesTipoActividadForm: ErrorFields = {
  nombre: [
    { required: 'Nombre es un dato obligatorio.' },
    { maxlength: 'El maximo de caracteres es 50.' },
  ],
  descripcion: [
    { required: 'Descripcion es un dato obligatorio.' },
    { maxlength: 'El maximo de caracteres es 250.' },
  ],
};

export function convertirTipoActividadFormDtoToTipoActividadRequest(
  tipoActividadFormDto: FormGroup<TipoActividadForm>,
): TipoActividadRequest {
  return {
    descripcion: tipoActividadFormDto.value.descripcion,
    nombre: tipoActividadFormDto.value.nombre,
  };
}
