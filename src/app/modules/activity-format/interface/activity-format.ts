import { MenuItems } from '@shared/interface/header-table.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';

export interface FormatoActividadPaginateResponse {
  formatosActividades: FormatoActividadResponse[];
  totalElementos: number;
  numeroPagina: number;
  tamanioPagina: number;
}

export interface FormatoActividadDatosResponse {
  datos: FormatoActividadResponse;
}

export interface CodigoRegistroActividadResonse {
  datos: string;
}

export interface FormatoActividadResponse {
  codigoFormatoActividad: string;
  codTipoActividad: string;
  descripcionTipoActividad: string;
  tema: string;
  serie: string;
  numeracion: number;
}

export interface FormatoActividadDatosRequest {
  datos: FormatoActividadRequest;
}

export interface FormatoActividadRequest {
  codTipoActividad: string | null | undefined;
  tema: string | null | undefined;
  serie: string | null | undefined;
}

// interfaces de las vistas
export interface FormatoActividadResponseTable extends FormatoActividadResponse {
  opciones: MenuItems[];
}

// formularios
export interface FormatoActividadFormDto {
  tipoActividad: AutoCompleteData | null | undefined;
  tema: string | null | undefined;
  serie: string | null | undefined;
}

export interface FormatoActividadForm {
  tipoActividad: FormControl<AutoCompleteData | null>;
  tema: FormControl<string | null>;
  serie: FormControl<string | null>;
}

// inicializar formulario y mensajes
export const formatoActividadFormGroup: FormGroup<FormatoActividadForm> =
  new FormGroup<FormatoActividadForm>({
    tipoActividad: new FormControl<AutoCompleteData | null>(null, {
      validators: [Validators.required],
    }),
    tema: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    serie: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(20)],
    }),
  });

export const errorMessagesFormatoActividadForm: ErrorFields = {
  tipoActividad: [{ required: 'El tipo de actividad es obligatorio.' }],
  tema: [
    { required: 'El tema es un dato obligatorio.' },
    { maxlength: 'El máximo de caracteres permitidos es 500.' },
  ],
  serie: [
    { required: 'La serie es un dato obligatorio.' },
    { maxlength: 'El máximo de caracteres permitidos es 20.' },
  ],
};

export function convertirFormatoActividadFormDtoToFormatoActividadRequest(
  formatoActividadFormDto: FormGroup<FormatoActividadForm>,
): FormatoActividadRequest {
  return {
    codTipoActividad: formatoActividadFormDto.value.tipoActividad?.key,
    tema: formatoActividadFormDto.value.tema,
    serie: formatoActividadFormDto.value.serie,
  };
}

export function convertirFormatoActividadResponseToFormatoActividadFormDto(
  formatoActividadResponse: FormatoActividadResponse,
): FormatoActividadFormDto {
  return {
    tipoActividad: {
      key: formatoActividadResponse.codTipoActividad,
      value: formatoActividadResponse.descripcionTipoActividad,
    },
    tema: formatoActividadResponse.tema,
    serie: formatoActividadResponse.serie,
  };
}
