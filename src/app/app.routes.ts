import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { ListActivityType } from '@modules/activity-type/components/list-activity-type/list-activity-type';
import { AddActivityType } from '@modules/activity-type/components/add-activity-type/add-activity-type';
import { ListActivityFormat } from '@modules/activity-format/components/list-activity-format/list-activity-format';
import { AddActivityFormat } from '@modules/activity-format/components/add-activity-format/add-activity-format';
import ListActivityRegister from '@modules/activity-register/components/list-activity-register/list-activity-register';
import { AddActivityRegister } from '@modules/activity-register/components/add-activity-register/add-activity-register';
import { EditActivityType } from '@modules/activity-type/components/edit-activity-type/edit-activity-type';
import { ActivityTypeResolver } from '@modules/activity-type/resolver/activity-type.resolver';
import { EditActivityFormat } from '@modules/activity-format/components/edit-activity-format/edit-activity-format';
import { ActivityFormatResolver } from '@modules/activity-format/resolver/activity-format.resolver';
import { ActivityRegisterResolver } from '@modules/activity-register/resolver/activity-register.resolver';
import { EditActivityRegister } from '@modules/activity-register/components/edit-activity-register/edit-activity-register';
import { ROUTES_WEB } from '@shared/const/routes-servidor.const';
import { ListUser } from './security/user/components/list-user/list-user';
import { AddUser } from './security/user/components/add-user/add-user';
import { EditUser } from './security/user/components/edit-user/edit-user';
import { UserResolver } from './security/user/resolver/user.resolver';
import { ListPermission } from './security/permission/components/list-permission/list-permission';
import { Login } from './security/authentication/components/login/login';
import { permisionGuard } from '@shared/guards/permision/permision.guard';
import { authGuard } from '@shared/guards/auth/auth.guard';
import { MODULOS } from '@shared/const/modulos.const';
import { PERMISOS } from '@shared/const/permisos.const';
import { NoPermitidoComponent } from '@shared/components/no-permitido/no-permitido.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { ViewUser } from './security/user/components/view-user/view-user';
import { UserPasswordResolver } from './security/user/resolver/user-password.resolver';
import { RecoverPassword } from './security/authentication/components/recover-password/recover-password';
import { ChangePassword } from './security/authentication/components/change-password/change-password';

export const routes: Routes = [
  {
    path: '',
    redirectTo: ROUTES_WEB.LOGIN,
    pathMatch: 'full',
  },
  {
    path: ROUTES_WEB.LOGIN,
    component: Login,
  },
  {
    path: ROUTES_WEB.RECUPERAR_CONTRASENA,
    component: RecoverPassword,
  },
  {
    path: ROUTES_WEB.ACTUALIZAR_CONTRASENA,
    component: ChangePassword,
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
  },
  {
    path: '',
    component: Layout,
    children: [
      {
        path: ROUTES_WEB.TIPO_ACTIVIDADES,
        component: ListActivityType,
        canActivate: [permisionGuard],
      },
      {
        path: ROUTES_WEB.TIPO_ACTIVIDADES + ROUTES_WEB.NUEVO,
        component: AddActivityType,
        canActivate: [authGuard],
        data: { modulo: MODULOS.GESTION_TIPO_ACTIVIDAD, accion: PERMISOS.AGREGAR },
      },
      {
        path: ROUTES_WEB.TIPO_ACTIVIDADES + ROUTES_WEB.CODIGO_TIPO_ACTIVIDAD,
        component: EditActivityType,
        resolve: { tipoActividad: ActivityTypeResolver },
        canActivate: [authGuard],
        data: { modulo: MODULOS.GESTION_TIPO_ACTIVIDAD, accion: PERMISOS.EDITAR },
      },
      {
        path: ROUTES_WEB.FORMATO_ACTIVIDADES,
        component: ListActivityFormat,
        canActivate: [permisionGuard],
      },
      {
        path: ROUTES_WEB.FORMATO_ACTIVIDADES + ROUTES_WEB.NUEVO,
        component: AddActivityFormat,
        canActivate: [authGuard],
        data: { modulo: MODULOS.GESTION_FORMATO_ACTIVIDAD, accion: PERMISOS.AGREGAR },
      },
      {
        path: ROUTES_WEB.FORMATO_ACTIVIDADES + ROUTES_WEB.CODIGO_FORMATO_ACTIVIDAD,
        component: EditActivityFormat,
        resolve: { formatoActividad: ActivityFormatResolver },
        canActivate: [authGuard],
        data: { modulo: MODULOS.GESTION_FORMATO_ACTIVIDAD, accion: PERMISOS.EDITAR },
      },
      {
        path: ROUTES_WEB.REGISTRO_ACTIVIDADES,
        component: ListActivityRegister,
        canActivate: [permisionGuard],
      },
      {
        path: ROUTES_WEB.REGISTRO_ACTIVIDADES + ROUTES_WEB.NUEVO,
        component: AddActivityRegister,
        canActivate: [authGuard],
        data: { modulo: MODULOS.GESTION_REGISTRO_ACTIVIDAD, accion: PERMISOS.AGREGAR },
      },
      {
        path: ROUTES_WEB.REGISTRO_ACTIVIDADES + ROUTES_WEB.CODIGO_REGISTRO_ACTIVIDAD,
        component: EditActivityRegister,
        resolve: { registroActividad: ActivityRegisterResolver },
        canActivate: [authGuard],
        data: { modulo: MODULOS.GESTION_REGISTRO_ACTIVIDAD, accion: PERMISOS.EDITAR },
      },
      {
        path: ROUTES_WEB.USUARIOS,
        component: ListUser,
        canActivate: [permisionGuard],
      },
      {
        path: ROUTES_WEB.USUARIOS + ROUTES_WEB.NUEVO,
        component: AddUser,
        canActivate: [authGuard],
        data: { modulo: MODULOS.GESTION_USUARIOS, accion: PERMISOS.AGREGAR },
      },
      {
        path: ROUTES_WEB.USUARIOS + ROUTES_WEB.CODIGO_USUARIO,
        component: EditUser,
        resolve: { usuario: UserResolver },
        canActivate: [authGuard],
        data: { modulo: MODULOS.GESTION_USUARIOS, accion: PERMISOS.EDITAR },
      },
      {
        path: ROUTES_WEB.PERFIL,
        component: ViewUser,
        resolve: { usuario: UserPasswordResolver },
      },
      {
        path: ROUTES_WEB.PERMISOS,
        component: ListPermission,
        canActivate: [permisionGuard],
      },
      {
        path: ROUTES_WEB.NOT_PERMISION,
        component: NoPermitidoComponent,
      },
      {
        path: '**',
        component: NotFoundComponent,
      },
    ],
  },
];
