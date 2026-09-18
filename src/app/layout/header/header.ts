import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AuthenticationService } from '../../security/authentication/service/authentication.service';
import { MenuItemResponse } from '../../security/authentication/interface/authentication';
import { UserService } from '../../security/user/service/user.service';
import { ROUTES_WEB } from '@shared/const/routes-servidor.const';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatExpansionModule,
    RouterLink,
    RouterLinkActive,
    NgOptimizedImage,
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header implements AfterViewInit, OnDestroy, OnInit {
  private readonly router: Router = inject(Router);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly breakpointObserver: BreakpointObserver = inject(BreakpointObserver);
  private readonly authenticationService: AuthenticationService = inject(AuthenticationService);
  private readonly usuarioService: UserService = inject(UserService);

  @ViewChildren('subTrigger') subTriggers!: QueryList<MatMenuTrigger>;
  @ViewChild('userTrigger') userTrigger!: MatMenuTrigger;
  @ViewChild('drawer') drawer!: MatSidenav;

  private destroy$ = new Subject<void>();

  public nombres: string = '';
  public apellidos: string = '';

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateActiveFromUrl(this.router.url);
      try {
        this.cdr.detectChanges();
      } catch {}
    }, 0);

    // Cerrar el sidenav automáticamente cuando la pantalla cambie a tamaño grande
    this.breakpointObserver
      .observe(['(min-width: 768px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result.matches) {
          try {
            if (this.drawer && this.drawer.opened) {
              this.drawer.close().then();
            }
          } catch {}
        }
      });

    // Cerrar submenus (mat-menu overlays) cuando la pantalla sea pequeña
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result.matches) {
          try {
            this.closeAllSubMenus();
            if (this.userTrigger && this.userTrigger.menuOpen) {
              this.userTrigger.closeMenu();
            }
          } catch {}
        }
      });

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((e) => {
        this.updateActiveFromUrl(e.urlAfterRedirects);
        try {
          if (this.drawer && this.drawer.opened) {
            this.drawer.close().then();
          }
        } catch {}
      });

    this.bindSubTriggers();
    this.subTriggers.changes.pipe(takeUntil(this.destroy$)).subscribe(() => this.bindSubTriggers());
    if (this.userTrigger) {
      this.userTrigger.menuOpened.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.closeAllSubMenus();
      });
    }
  }

  ngOnInit(): void {
    this.cargarMenuItems();
    this.usuarioService.usuario$.subscribe((usuario) => {
      if (usuario) {
        this.nombres = usuario.nombres;
        this.apellidos = usuario.apellidos;
      }
    });
  }

  public initials(): string {
    return this.nombres?.charAt(0)?.toUpperCase() + this.apellidos?.charAt(0)?.toUpperCase();
  }

  private updateActiveFromUrl(url: string): void {
    this.menuItems.forEach((menuItem) => {
      menuItem.active = false;
      if (menuItem.items) {
        menuItem.items.forEach((menuItemChildren) => (menuItemChildren.active = false));
      }
    });
    for (const menuItem of this.menuItems) {
      if (menuItem.link && this.isRouteMatch(url, menuItem.link)) {
        menuItem.active = true;
      }

      if (menuItem.items) {
        for (const child of menuItem.items) {
          if (child.link && this.isRouteMatch(url, child.link)) {
            child.active = true;
            menuItem.active = true;
            break;
          }
        }
      }
    }
  }

  private isRouteMatch(currentUrl: string, route: string): boolean {
    try {
      return this.router.isActive(route, {
        paths: 'subset',
        queryParams: 'subset',
        fragment: 'ignored',
        matrixParams: 'ignored',
      });
    } catch {
      return currentUrl === route || currentUrl.startsWith(route);
    }
  }

  private bindSubTriggers(): void {
    this.subTriggers.forEach((t) => {
      t.menuOpened.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.userTrigger && this.userTrigger.menuOpen) {
          this.userTrigger.closeMenu();
          t.openMenu();
        }
      });
    });
  }

  private closeAllSubMenus(): void {
    this.subTriggers.forEach((t) => {
      if (t.menuOpen) {
        t.closeMenu();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  menuItems: MenuItemResponse[] = [];

  private cargarMenuItems() {
    this.authenticationService.getMenuItems().subscribe((menuItems: MenuItemResponse[]) => {
      this.menuItems = menuItems;
      this.cdr.detectChanges();
    });
    this.cdr.detectChanges();
  }

  protected closeSession() {
    this.authenticationService.signOut();
  }

  protected redirectPerfil() {
    this.router.navigate([ROUTES_WEB.PERFIL]).then();
  }
}
