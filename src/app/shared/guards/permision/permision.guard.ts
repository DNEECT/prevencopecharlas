import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../../../security/authentication/service/authentication.service';
import { PersmisionService } from '@shared/service/permision/persmision.service';
import { ROUTES_WEB } from '@shared/const/routes-servidor.const';

export const permisionGuard: CanActivateFn = async (route, state) => {
  const permisionDataService: PersmisionService = inject(PersmisionService);
  const authenticationService: AuthenticationService = inject(AuthenticationService);
  const router = inject(Router);

  if (!authenticationService.isAuthenticated()) {
    return router.parseUrl(ROUTES_WEB.LOGIN);
  }

  try {
    const isPermitted = await permisionDataService.hasPermissionRouteGuard(state.url);
    if (isPermitted) {
      return true;
    }

    return router.parseUrl(ROUTES_WEB.NOT_PERMISION);
  } catch (error) {
    return router.parseUrl(ROUTES_WEB.NOT_PERMISION);
  }
};
