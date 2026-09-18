import { inject, Injectable } from '@angular/core';
import { PermisionDataService } from '../permision-data/permision-data.service';
import { AuthenticationService } from '../../../security/authentication/service/authentication.service';
import { MenuItemResponse } from '../../../security/authentication/interface/authentication';

@Injectable({
  providedIn: 'root',
})
export class PersmisionService {
  private readonly autenticationService: AuthenticationService = inject(AuthenticationService);
  private readonly permisionData: PermisionDataService = inject(PermisionDataService);

  public hasPermission(abreviaturaModulo: string, abreviaturaAccion: string): boolean {
    let menuItems = this.permisionData.getCurrentData();

    if (!menuItems || menuItems.length === 0) {
      this.autenticationService.updateMenuItems();
      menuItems = this.permisionData.getCurrentData();
    }

    return this.validarpermisoss(menuItems || [], abreviaturaModulo, abreviaturaAccion);
  }

  public async hasPermissionGuard(
    abreviaturaModulo: string,
    abreviaturaAccion: string,
  ): Promise<boolean> {
    let menuItems = this.permisionData.getCurrentData();

    if (!menuItems || menuItems.length === 0) {
      await this.autenticationService.updateMenuItemsAsync();
      menuItems = this.permisionData.getCurrentData();
    }

    return this.validarpermisoss(menuItems || [], abreviaturaModulo, abreviaturaAccion);
  }

  public async hasPermissionRouteGuard(route: string): Promise<boolean> {
    let menuItems = this.permisionData.getCurrentData();

    if (!menuItems || menuItems.length === 0) {
      await this.autenticationService.updateMenuItemsAsync();
      menuItems = this.permisionData.getCurrentData();
    }

    const normalizeRoute = (route: string) => route.replace(/\/:\w+/g, '/.*');

    const checkPermission = (items: MenuItemResponse[], currentRoute: string): boolean => {
      for (const item of items) {
        const normalizedLink = normalizeRoute(item.link || '');
        const routeMatches = new RegExp(`^${normalizedLink}$`).test(currentRoute);

        if (routeMatches) {
          return true;
        }

        if (item.items && checkPermission(item.items, currentRoute)) {
          return true;
        }
      }

      return false;
    };

    return checkPermission(menuItems || [], route);
  }

  private validarpermisoss(
    items: MenuItemResponse[],
    abreviaturaModulo: string,
    abreviaturaAccion: string,
  ): boolean {
    for (const item of items) {
      // 1. Coincide módulo
      if (item.abreviatura === abreviaturaModulo) {
        // 1.1 Validar permisos del módulo
        if (item.permisos?.some((p) => p.abreviatura === abreviaturaAccion)) {
          return true;
        }

        // 1.2 Buscar en subitems
        if (item.items && this.validarpermisoss(item.items, abreviaturaModulo, abreviaturaAccion)) {
          return true;
        }

        // Si módulo coincide pero no tiene permisos → no seguir revisando otros módulos
        return false;
      }

      // 2. Si no coincide módulo, busca recursivamente en hijos
      if (item.items && this.validarpermisoss(item.items, abreviaturaModulo, abreviaturaAccion)) {
        return true;
      }
    }

    return false;
  }
}
