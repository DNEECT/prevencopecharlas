export interface TipoAsistenteDatosResponse {
  datos: TipoAsistenteResponse[];
}

export interface TipoAsistenteResponse {
  codigoTipoAsistente: string;
  nombre: string;
  descripcion: string;
}
