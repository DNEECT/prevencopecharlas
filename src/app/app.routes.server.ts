import { RenderMode, ServerRoute } from '@angular/ssr';
import { ROUTES_WEB } from '@shared/const/routes-servidor.const';

export const serverRoutes: ServerRoute[] = [
  // Login puede prerenderizarse
  { path: ROUTES_WEB.LOGIN, renderMode: RenderMode.Client },

  // Rutas de aplicación: forzar render en cliente para evitar guards SSR que dependen de localStorage
  { path: ROUTES_WEB.TIPO_ACTIVIDADES, renderMode: RenderMode.Client },
  { path: ROUTES_WEB.TIPO_ACTIVIDADES + ROUTES_WEB.NUEVO, renderMode: RenderMode.Client },
  {
    path: ROUTES_WEB.TIPO_ACTIVIDADES + ROUTES_WEB.CODIGO_TIPO_ACTIVIDAD,
    renderMode: RenderMode.Client,
  },

  { path: ROUTES_WEB.FORMATO_ACTIVIDADES, renderMode: RenderMode.Client },
  { path: ROUTES_WEB.FORMATO_ACTIVIDADES + ROUTES_WEB.NUEVO, renderMode: RenderMode.Client },
  {
    path: ROUTES_WEB.FORMATO_ACTIVIDADES + ROUTES_WEB.CODIGO_FORMATO_ACTIVIDAD,
    renderMode: RenderMode.Client,
  },

  { path: ROUTES_WEB.REGISTRO_ACTIVIDADES, renderMode: RenderMode.Client },
  { path: ROUTES_WEB.REGISTRO_ACTIVIDADES + ROUTES_WEB.NUEVO, renderMode: RenderMode.Client },
  {
    path: ROUTES_WEB.REGISTRO_ACTIVIDADES + ROUTES_WEB.CODIGO_REGISTRO_ACTIVIDAD,
    renderMode: RenderMode.Client,
  },

  { path: ROUTES_WEB.USUARIOS, renderMode: RenderMode.Client },
  { path: ROUTES_WEB.USUARIOS + ROUTES_WEB.NUEVO, renderMode: RenderMode.Client },
  { path: ROUTES_WEB.USUARIOS + ROUTES_WEB.CODIGO_USUARIO, renderMode: RenderMode.Client },

  { path: ROUTES_WEB.PERMISOS, renderMode: RenderMode.Client },
  { path: ROUTES_WEB.PERFIL, renderMode: RenderMode.Client },

  // Rutas de estado público (pueden prerenderizarse)
  { path: ROUTES_WEB.NOT_PERMISION, renderMode: RenderMode.Client },

  // Ruta comodín
  { path: '**', renderMode: RenderMode.Client },
];
