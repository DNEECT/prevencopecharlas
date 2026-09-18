import { FormControl } from '@angular/forms';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';

export interface PermisosDetalleResponse {
  codigoModuloAccionRolModulo: string;
  codigoAccion: string;
  nombreAccion: string;
  estado: boolean;
}

export interface PermisosResponse {
  codigoRolModulo: string;
  codigoModulo: string;
  nombreModulo: string;
  acciones: PermisosDetalleResponse[];
}

export interface PermisosDatosResponse {
  datos: PermisosResponse[];
}

export interface AccionesResponse {
  codigoAccion: string;
  descripcion: string;
  abreviatura: string;
}

export interface AccionesDatosResponse {
  datos: AccionesResponse[];
}

export interface PermisosForm {
  rol: FormControl<AutoCompleteData | null>;
}
