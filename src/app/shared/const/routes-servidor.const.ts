export const ROUTES_SERVIDOR_PATH = {
  // Temporary legacy routes retained only by administrative screens that have
  // not yet moved to Supabase repositories.
  BASE_URL: 'https://prevencope.actividades.api.fordevs.pe/ne-pre-gestionactividades/v1',
  // BASE_URL: 'http://localhost:9099/ne-pre-gestionactividades/v1',
  ROLES: '/roles',
  ACCIONES: '/acciones',
  USUARIO: '/usuarios',
  PERMISOS: '/permisos',
};

export const ROUTES_WEB = {
  TIPO_ACTIVIDADES: 'tipo-actividad',
  FORMATO_ACTIVIDADES: 'formato-actividad',
  REGISTRO_ACTIVIDADES: 'registro-actividad',
  USUARIOS: 'usuario',
  PERFIL: 'perfil',
  PERMISOS: 'permiso',
  NUEVO: '/nuevo',
  CODIGO_TIPO_ACTIVIDAD: '/:codigoTipoActividad',
  CODIGO_FORMATO_ACTIVIDAD: '/:codigoFormatoActividad',
  CODIGO_REGISTRO_ACTIVIDAD: '/:codigoRegistroActividad',
  CODIGO_USUARIO: '/:codigoUsuario',
  LOGIN: 'login',
  // Rutas para estados especiales
  NOT_PERMISION: 'not-permision',
};
