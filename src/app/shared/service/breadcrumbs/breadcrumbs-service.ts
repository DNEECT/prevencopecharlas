import { EventEmitter, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Breadcrumbs } from '@shared/interface/breadcrumbs.interface';

@Injectable({ providedIn: 'root' })
export class BreadcrumbsService {
  private currentPaths: Breadcrumbs[] = [];
  private readonly dynamicRoot = new EventEmitter<Breadcrumbs>();
  private readonly dynamicPath = new EventEmitter<{ routes: Breadcrumbs[]; replace: boolean }>();
  private readonly router: Router = inject(Router);

  public setRoot(routeData: Breadcrumbs) {
    this.currentPaths = [];
    this.dynamicPath.emit({ routes: this.currentPaths, replace: true });
    this.dynamicRoot.emit(routeData);
  }

  public pushPath(routeSData: Breadcrumbs[]) {
    routeSData.forEach((newRoute) => {
      const routeIndex = this.currentPaths.findIndex(
        (existingRoute) => existingRoute.path === newRoute.path,
      );
      if (routeIndex === -1) {
        this.currentPaths.push(newRoute);
      }
    });

    this.dynamicPath.emit({ routes: this.currentPaths, replace: false });
  }

  public replacePath(routeSData: Breadcrumbs[]) {
    this.currentPaths = routeSData;
    this.dynamicPath.emit({ routes: routeSData, replace: true });
  }

  public removeRouteByPath(routePath: string) {
    this.currentPaths = this.currentPaths.filter((route) => route.path !== routePath);
    this.dynamicPath.emit({ routes: this.currentPaths, replace: true });
  }

  public listen(instance: { root: Breadcrumbs | null; paths: Breadcrumbs[] }) {
    this.dynamicRoot.subscribe((data: Breadcrumbs) => {
      instance.root = data;
    });

    this.dynamicPath.subscribe((data: { routes: Breadcrumbs[]; replace: boolean }) => {
      if (data.replace) {
        instance.paths = data.routes;
      } else {
        data.routes.forEach((route) => {
          if (!instance.paths.find((existingRoute) => existingRoute.path === route.path)) {
            instance.paths.push(route);
          }
        });
      }
    });
  }

  public navigateTo(instance: { rootRoute: Breadcrumbs; path: Breadcrumbs[] }, route: Breadcrumbs) {
    if (instance.path[instance.path.length - 1] !== route) {
      instance.path = instance.path.slice(0, instance.path.indexOf(route));
      this.router.navigateByUrl(route.path).then();
    }
  }
}
