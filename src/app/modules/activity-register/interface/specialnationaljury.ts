export interface JuradoNacionalEspecialDatosResponse {
  datos: JuradoNacionalEspecialResponse[];
}

export interface JuradoNacionalEspecialResponse {
  codigoJuradoElectoral: string;
  codJuradoElectoral: number;
  nombreJuradoElectoral: string;
  direccion: string | null;
  telefono: string | null;
  codProcesoElectoral: number | null;
  feApertura: string | null;
  feCierreJurisdiccional: string | null;
  feCierreAdministrativo: string | null;
  actaCierre: string | null;
  siglas: string | null;
  horarioAtencion: string | null;
  ubigeo: string | null;
  departamento: string | null;
  provincia: string | null;
  codEstado: string | null;
  codParamCerrado: number | null;
}
