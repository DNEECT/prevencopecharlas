export interface PublicoObjetivoDatosResponse {
  datos: PublicoObjetivoResponse[];
}

export interface PublicoObjetivoResponse {
  codigoPublicoObjetivo: string;
  nombre: string;
  descripcion: string;
}
