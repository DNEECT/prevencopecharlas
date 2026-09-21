import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PersmisionService } from '@shared/service/permision/persmision.service';
import { AuthenticationService } from '../../../security/authentication/service/authentication.service';
import { ROUTES_WEB } from '@shared/const/routes-servidor.const';

export const authGuard: CanActivateFn = async (route) => {
  const permisionDataService: PersmisionService = inject(PersmisionService);
  const authenticationService: AuthenticationService = inject(AuthenticationService);
  const router = inject(Router);
  const { modulo, accion } = route.data;

  if (!(await authenticationService.hasActiveSession())) {
    return router.parseUrl(ROUTES_WEB.LOGIN);
  }

  try {
    const permit = await permisionDataService.hasPermissionGuard(modulo, accion);

    if (permit) {
      return true;
    }

    return router.parseUrl(ROUTES_WEB.NOT_PERMISION);
  } catch (error) {
    return false;
  }
};
