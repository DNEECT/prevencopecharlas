import { MenuItems } from '@shared/interface/header-table.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { MENU_ACTIONS_ITEM } from '@shared/const/menu-acciones.const';

export interface RegistroActividadPaginateResponse {
  registroActividades: RegistroActividadResponse[];
  totalElementos: number;
  numeroPagina: number;
  tamanioPagina: number;
}

export interface RegistroActividadDatosResponse {
  datos: RegistroActividadResponse;
}

export interface RegistroActividadResponse {
  codigoRegistroActividad: string;
  codigo: string;
  codProcesoElectoral: string;
  nombreProcesoElectoral: string;
  codJuradoNacionalEspecial: string;
  nombreJuradoNacionalEspecial: string;
  codTipoActividad: string;
  nombreTipoActividad: string;
  codTipoAsistente: string;
  nombreTipoAsistente: string;
  codPublicoObjetivo: string;
  nombrePublicoObjetivo: string;
  lugar: string;
  tema: string;
  serie: string;
  numeracion: number;
  fecha: string;
  hora: string;
  recomendaciones?: string | null;
  observaciones?: string | null;
  preguntas?: string | null;
  adjuntoListaAsistentes?: string | null;
  adjuntoRegistroFotografico?: string | null;
  participantes: RegistroActividadParticipanteResponse[];
}

export interface RegistroActividadParticipanteResponse {
  dni: string;
  nombresCompletos: string;
  sexo: string;
  edad: number;
  organizacion: string;
  cargo: string;
  telefono: string;
  correo: string;
  poblacion: string;
}

export interface RegistroActividadDatosRequest {
  datos: RegistroActividadRequest;
}

export interface RegistroActividadRequest {
  codTipoActividad: string | null | undefined;
  tema: string | null | undefined;
  codTipoAsistentes: string | null | undefined;
  codPublicoObjetivo: string | null | undefined;
  lugar: string | null | undefined;
  codProcesoElectoral: string | null | undefined;
  codJuradoNacionalEspecial: string | null | undefined;
  fecha: string | null | undefined;
  hora: string | null | undefined;
  recomendaciones?: string | null | undefined;
  preguntas?: string | null | undefined;
  adjuntoListaAsistentes?: string | null | undefined;
  adjuntoRegistroFotografico?: string | null | undefined;
  participantes: RegistroActividadParticipanteRequest[] | null | undefined;
}

export interface RegistroActividadParticipanteRequest {
  dni: string | null | undefined;
  nombresCompletos: string | null | undefined;
  sexo: string | null | undefined;
  edad: number | null | undefined;
  organizacion: string | null | undefined;
  cargo: string | null | undefined;
  telefono: string | null | undefined;
  correo: string | null | undefined;
  poblacion: string | null | undefined;
}

// interfaces de las vistas
export interface RegistroActividadResponseTable extends RegistroActividadResponse {
  cantidadParticipantes: number;
  opciones: MenuItems[];
}

export interface RegistroActividadParticipanteResponseTable
  extends RegistroActividadParticipanteResponse {
  indice: number;
  isAfroPeruano: boolean;
  isIndigena: boolean;
  isDiscapacitado: boolean;
  opciones: MenuItems[];
}

// formularios
export interface RegistroActividadFormDto {
  tipoActividad: AutoCompleteData | null | undefined;
  tema: AutoCompleteData | null | undefined;
  tipoAsistente: AutoCompleteData | null | undefined;
  publicoObjetivo: AutoCompleteData | null | undefined;
  lugar: string | null | undefined;
  juradoEspecial: AutoCompleteData | null | undefined;
  procesoElectoral: AutoCompleteData | null | undefined;
  fecha: string | null | undefined;
  hora: string | null | undefined;
  recomendaciones?: string | null | undefined;
  preguntas?: string | null | undefined;
  adjuntoListaAsistentes?: File | string | null | undefined;
  adjuntoRegistroFotografico?: File | string | null | undefined;
}

export interface RegistroActividadParticipanteFormDto {
  dni: string | null | undefined;
  nombresCompletos: string | null | undefined;
  sexo: AutoCompleteData | null | undefined;
  edad: number | null | undefined;
  organizacion: string | null | undefined;
  cargo: string | null | undefined;
  telefono: string | null | undefined;
  correo: string | null | undefined;
  poblacion: AutoCompleteData | null | undefined;
}

export interface RegistroActividadForm {
  tipoActividad: FormControl<AutoCompleteData | null>;
  tema: FormControl<AutoCompleteData | null>;
  tipoAsistente: FormControl<AutoCompleteData | null>;
  publicoObjetivo: FormControl<AutoCompleteData | null>;
  lugar: FormControl<string | null>;
  juradoEspecial: FormControl<AutoCompleteData | null>;
  procesoElectoral: FormControl<AutoCompleteData | null>;
  fecha: FormControl<string | null>;
  hora: FormControl<string | null>;
  recomendaciones: FormControl<string | null>;
  preguntas: FormControl<string | null>;
  adjuntoListaAsistentes: FormControl<File | string | null>;
  adjuntoRegistroFotografico: FormControl<File | string | null>;
}

export interface RegistroActividadParticipanteForm {
  dni: FormControl<string | null>;
  nombresCompletos: FormControl<string | null>;
  sexo: FormControl<AutoCompleteData | null>;
  edad: FormControl<number | null>;
  organizacion: FormControl<string | null>;
  cargo: FormControl<string | null>;
  telefono: FormControl<string | null>;
  correo: FormControl<string | null>;
  poblacion: FormControl<AutoCompleteData | null>;
}

// inicializar formulario y mensajes
export const registroActividadFormGroup: FormGroup<RegistroActividadForm> =
  new FormGroup<RegistroActividadForm>({
    tipoActividad: new FormControl<AutoCompleteData | null>(null, {
      validators: [Validators.required],
    }),
    tema: new FormControl<AutoCompleteData | null>(null, {
      validators: [Validators.required],
    }),
    publicoObjetivo: new FormControl<AutoCompleteData | null>(null, {
      validators: [Validators.required],
    }),
    tipoAsistente: new FormControl<AutoCompleteData | null>(null, {
      validators: [Validators.required],
    }),
    lugar: new FormControl<string | null>(null, {
      validators: [Validators.required],
    }),
    juradoEspecial: new FormControl<AutoCompleteData | null>(null, {
      validators: [Validators.required],
    }),
    procesoElectoral: new FormControl<AutoCompleteData | null>(null, {
      validators: [Validators.required],
    }),
    fecha: new FormControl<string | null>(null, {
      validators: [Validators.required],
    }),
    hora: new FormControl<string | null>(null, {
      validators: [Validators.required],
    }),
    recomendaciones: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    preguntas: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    adjuntoListaAsistentes: new FormControl<File | string | null>(null),
    adjuntoRegistroFotografico: new FormControl<File | string | null>(null),
  });

export const formatoParticipanteFormGroup: FormGroup<RegistroActividadParticipanteForm> =
  new FormGroup<RegistroActividadParticipanteForm>({
    dni: new FormControl<string | null>(null, {
      validators: [Validators.required, Validators.maxLength(8), Validators.minLength(8)],
    }),
    nombresCompletos: new FormControl<string | null>(null, {
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    sexo: new FormControl<AutoCompleteData | null>(null, {
      validators: [Validators.required],
    }),
    edad: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    organizacion: new FormControl<string | null>(null, {
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    cargo: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(50)],
    }),
    telefono: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(20)],
    }),
    correo: new FormControl<string | null>(null, {
      validators: [Validators.email, Validators.maxLength(100)],
    }),
    poblacion: new FormControl<AutoCompleteData | null>(null, {
      validators: [Validators.maxLength(100)],
    }),
  });
// typescript
export const errorMessagesRegistroActividadForm: ErrorFields = {
  tipoActividad: [{ required: 'El tipo de actividad es obligatorio.' }],
  publicoObjetivo: [{ required: 'El público objetivo es obligatorio.' }],
  tipoAsistente: [{ required: 'El tipo de asistentes es obligatorio.' }],
  lugar: [{ required: 'El lugar es un dato obligatorio.' }],
  tema: [{ required: 'El tema es un dato obligatorio.' }],
  procesoElectoral: [{ required: 'El proceso electoral es obligatorio.' }],
  fecha: [{ required: 'La fecha es obligatoria.' }],
  hora: [{ required: 'La hora es obligatoria.' }],
  recomendaciones: [
    { required: 'Las recomendaciones son obligatorias.' },
    { maxlength: 'Las recomendaciones el máximo de caracteres permitidos es 500.' },
  ],
  preguntas: [
    { required: 'Las preguntas son obligatorias.' },
    { maxlength: 'Las preguntas el máximo de caracteres permitidos es 500.' },
  ],
};

export const errorMessagesRegistroParticipanteForm: ErrorFields = {
  dni: [
    { required: 'El DNI es obligatorio.' },
    { minlength: 'El DNI debe tener 8 caracteres.' },
    { maxlength: 'El DNI debe tener 8 caracteres.' },
  ],
  nombresCompletos: [
    { required: 'Los nombres completos son obligatorios.' },
    { maxlength: 'El máximo de caracteres permitidos es 200.' },
  ],
  sexo: [{ required: 'El sexo es obligatorio.' }],
  edad: [{ required: 'La edad es obligatoria.' }, { min: 'La edad debe ser mayor o igual a 0.' }],
  organizacion: [
    { required: 'La organización es obligatoria.' },
    { maxlength: 'El máximo de caracteres permitidos es 50.' },
  ],
  cargo: [
    { required: 'El cargo es obligatorio.' },
    { maxlength: 'El máximo de caracteres permitidos es 50.' },
  ],
  telefono: [
    { required: 'El teléfono es obligatorio.' },
    { maxlength: 'El máximo de caracteres permitidos es 20.' },
  ],
  correo: [
    { required: 'El correo es obligatorio.' },
    { email: 'El correo electrónico no tiene un formato válido.' },
    { maxlength: 'El máximo de caracteres permitidos es 100.' },
  ],
  poblacion: [
    { required: 'La población es obligatoria.' },
    { maxlength: 'El máximo de caracteres permitidos es 100.' },
  ],
};

export function convertirRegistroActividadParticipanteFormToRegistroActividadParticipanteResponseTable(
  registroActividadForm: FormGroup<RegistroActividadParticipanteForm>,
  indice: number,
): RegistroActividadParticipanteResponseTable {
  return {
    indice: indice + 1,
    dni: registroActividadForm.value.dni ?? '',
    nombresCompletos: registroActividadForm.value.nombresCompletos ?? '',
    sexo: registroActividadForm.value.sexo?.value ?? '',
    edad: registroActividadForm.value.edad ?? 0,
    organizacion: registroActividadForm.value.organizacion ?? '',
    cargo: registroActividadForm.value.cargo ?? '',
    telefono: registroActividadForm.value.telefono ?? '',
    correo: registroActividadForm.value.correo ?? '',
    poblacion: registroActividadForm.value.poblacion?.value ?? '',
    isAfroPeruano: registroActividadForm.value.poblacion?.value === 'Afro-Peruana',
    isIndigena: registroActividadForm.value.poblacion?.value === 'Indígena',
    isDiscapacitado: registroActividadForm.value.poblacion?.value === 'Personas con discapacidad',
    opciones: [MENU_ACTIONS_ITEM.DELETE],
  };
}

export function convertirRegistroActividadFormDtoToRegistroActividadRequest(
  registroActividadForm: FormGroup<RegistroActividadForm>,
  participantesResponse: RegistroActividadParticipanteResponseTable[],
  adjuntoListaAsistentesUrl?: string | null,
  adjuntoRegistroFotograficoUrl?: string | null,
): RegistroActividadRequest {
  return {
    codTipoActividad: registroActividadForm.value.tipoActividad?.key ?? null,
    tema: registroActividadForm.value.tema?.value ?? null,
    codTipoAsistentes: registroActividadForm.value.tipoAsistente?.key ?? null,
    codPublicoObjetivo: registroActividadForm.value.publicoObjetivo?.key ?? null,
    lugar: registroActividadForm.value.lugar ?? null,
    codProcesoElectoral: registroActividadForm.value.procesoElectoral?.key ?? null,
    codJuradoNacionalEspecial: registroActividadForm.value.juradoEspecial?.key ?? null,
    fecha: registroActividadForm.value.fecha ?? null,
    hora: registroActividadForm.value.hora ?? null,
    recomendaciones: registroActividadForm.value.recomendaciones ?? null,
    preguntas: registroActividadForm.value.preguntas ?? null,
    adjuntoListaAsistentes: adjuntoListaAsistentesUrl ?? null,
    adjuntoRegistroFotografico: adjuntoRegistroFotograficoUrl ?? null,
    participantes:
      convertirRegistroActividadParticipanteResponseTableToRegistroActividadParticipanteRequest(
        participantesResponse,
      ),
  };
}

export function convertirRegistroActividadParticipanteResponseTableToRegistroActividadParticipanteRequest(
  particpantesResponse: RegistroActividadParticipanteResponseTable[],
): RegistroActividadParticipanteRequest[] {
  return particpantesResponse.map(
    (registroActividadParticipante: RegistroActividadParticipanteResponseTable) => {
      return {
        dni: registroActividadParticipante.dni,
        nombresCompletos: registroActividadParticipante.nombresCompletos,
        sexo: registroActividadParticipante.sexo,
        edad: registroActividadParticipante.edad,
        organizacion: registroActividadParticipante.organizacion,
        cargo: registroActividadParticipante.cargo,
        telefono: registroActividadParticipante.telefono,
        correo: registroActividadParticipante.correo,
        poblacion: registroActividadParticipante.poblacion,
      };
    },
  );
}

export function convertirRegistroActividadResponseToRegistroActividadFormDto(
  registroActividadResponse: RegistroActividadResponse,
): RegistroActividadFormDto {
  return {
    tipoActividad: {
      key: registroActividadResponse.codTipoActividad,
      value: registroActividadResponse.nombreTipoActividad,
    },
    publicoObjetivo: {
      key: registroActividadResponse.codPublicoObjetivo,
      value: registroActividadResponse.nombrePublicoObjetivo,
    },
    tipoAsistente: {
      key: registroActividadResponse.codTipoAsistente,
      value: registroActividadResponse.nombreTipoAsistente,
    },
    tema: { key: registroActividadResponse.tema, value: registroActividadResponse.tema },
    lugar: registroActividadResponse.lugar,
    procesoElectoral: {
      key: registroActividadResponse.codProcesoElectoral,
      value: registroActividadResponse.nombreProcesoElectoral,
    },
    juradoEspecial: {
      key: registroActividadResponse.codJuradoNacionalEspecial,
      value: registroActividadResponse.nombreJuradoNacionalEspecial,
    },
    fecha: registroActividadResponse.fecha,
    hora: registroActividadResponse.hora,
    recomendaciones: registroActividadResponse.recomendaciones,
    preguntas: registroActividadResponse.preguntas,
    adjuntoListaAsistentes: registroActividadResponse.adjuntoListaAsistentes,
    adjuntoRegistroFotografico: registroActividadResponse.adjuntoRegistroFotografico,
  };
}
