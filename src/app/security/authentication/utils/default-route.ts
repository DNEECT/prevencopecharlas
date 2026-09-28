import { ROUTES_WEB } from '@shared/const/routes-servidor.const';
import { MenuItemResponse } from '../interface/authentication';

function normalizeRoute(route: string): string {
  return route.startsWith('/') ? route : `/${route}`;
}

export function resolveDefaultRoute(menuItems: MenuItemResponse[]): string | null {
  const routes = menuItems
    .filter((item) => item.isVisible !== false)
    .flatMap((item) => [item, ...(item.items ?? []).filter((child) => child.isVisible !== false)])
    .map((item) => item.link)
    .filter((route): route is string => !!route)
    .map(normalizeRoute);

  const activityRoute = normalizeRoute(ROUTES_WEB.REGISTRO_ACTIVIDADES);
  return routes.includes(activityRoute) ? activityRoute : (routes[0] ?? null);
}

export function normalizeDefaultRoute(route: string): string {
  return normalizeRoute(route);
}
