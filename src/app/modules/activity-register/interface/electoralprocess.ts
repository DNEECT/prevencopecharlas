export interface ProcesoElectoralDatosResponse {
  datos: ProcesoElectoralResponse[];
}

export interface ProcesoElectoralResponse {
  codigoProcesoElectoral: string;
  nombre: string;
  descripcion: string;
  esPredeterminado: boolean;
}
