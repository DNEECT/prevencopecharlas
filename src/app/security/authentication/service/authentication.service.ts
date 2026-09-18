import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthenticationRepository } from '../repository/authentication.repository';
import {
  LoginDatosRequest,
  LoginDatosResponse,
  LoginRequest,
  LoginResponse,
  MenuItemResponse,
} from '../interface/authentication';
import { LocalStorageService } from '@shared/service/local-storage/local-storage.service';
import { Router } from '@angular/router';
import { PermisionDataService } from '@shared/service/permision-data/permision-data.service';
import { SECURITY } from '@shared/const/security.const';
import { ROUTES_WEB } from '@shared/const/routes-servidor.const';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly authenticationRepository: AuthenticationRepository = inject(AuthenticationRepository);
  private readonly localStorageService: LocalStorageService = inject(LocalStorageService);
  private readonly router: Router = inject(Router);
  private readonly permisionData: PermisionDataService = inject(PermisionDataService);

  public login(request: LoginRequest): Observable<LoginResponse> {
    const requestDatos: LoginDatosRequest = {
      datos: request,
    };
    return this.authenticationRepository
      .login(requestDatos)
      .pipe(map((response: LoginDatosResponse) => response.datos));
  }

  public setUsuarioLogueado(usuario: LoginResponse) {
    this.setAccessToken(usuario.token);
    this.setRouteDefaul(usuario.pathDefault);
  }

  public setAccessToken(token: string) {
    this.localStorageService.setItem(SECURITY.TOKEN, token);
  }

  public setRouteDefaul(route: string) {
    this.localStorageService.setItem(SECURITY.ROUTE_DEFAULT, route);
  }

  public getAccessToken(): string {
    return this.localStorageService.getItem(SECURITY.TOKEN) ?? '';
  }

  public getRouteDefault(): string {
    return this.localStorageService.getItem(SECURITY.ROUTE_DEFAULT) ?? '';
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  public signOut() {
    this.localStorageService.removeItem(SECURITY.TOKEN);
    this.localStorageService.removeItem(SECURITY.ROUTE_DEFAULT);
    this.permisionData.clearData();
    this.router.navigate([ROUTES_WEB.LOGIN]).then(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    });
  }

  public updateMenuItems(): void {
    this.permisionData.clearData();
    this.authenticationRepository.getMenuItems().subscribe({
      next: (response) => {
        this.permisionData.setData(response.datos);
      },
    });
  }

  public updateMenuItemsAsync(): Promise<void> {
    return new Promise((resolve) => {
      this.authenticationRepository.getMenuItems().subscribe({
        next: (response) => {
          this.permisionData.setData(response.datos);
          resolve();
        },
      });
    });
  }

  public getMenuItems(): Observable<MenuItemResponse[]> {
    return this.authenticationRepository.getMenuItems().pipe(
      map((response) => {
        response.datos = response.datos.map((item) => ({
          ...item,
          id: uuidv4(),
        }));

        return response.datos;
      }),
    );
  }
}
