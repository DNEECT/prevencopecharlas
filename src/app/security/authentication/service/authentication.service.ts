import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { AuthenticationRepository } from '../repository/authentication.repository';
import { LoginDatosRequest, LoginDatosResponse, LoginRequest, LoginResponse, MenuItemResponse } from '../interface/authentication';
import { LocalStorageService } from '@shared/service/local-storage/local-storage.service';
import { Router } from '@angular/router';
import { PermisionDataService } from '@shared/service/permision-data/permision-data.service';
import { SECURITY } from '@shared/const/security.const';
import { ROUTES_WEB } from '@shared/const/routes-servidor.const';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly authenticationRepository = inject(AuthenticationRepository);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly router = inject(Router);
  private readonly permisionData = inject(PermisionDataService);
  private readonly supabaseService = inject(SupabaseService);
  private get supabase() { return this.supabaseService.client; }
  private activeUserId: string | null = null;

  public login(request: LoginRequest): Observable<LoginResponse> {
    const requestDatos: LoginDatosRequest = { datos: request };
    return this.authenticationRepository.login(requestDatos).pipe(
      map((response: LoginDatosResponse) => response.datos),
    );
  }

  public setUsuarioLogueado(usuario: LoginResponse): void {
    this.setRouteDefaul(usuario.pathDefault);
  }

  public setRouteDefaul(route: string): void {
    this.localStorageService.setItem(SECURITY.ROUTE_DEFAULT, route);
  }

  public getAccessToken(): string {
    // Spring's JWT and Supabase's access token are not interchangeable.
    return '';
  }

  public getRouteDefault(): string {
    return this.localStorageService.getItem(SECURITY.ROUTE_DEFAULT) || ROUTES_WEB.REGISTRO_ACTIVIDADES;
  }

  public isAuthenticated(): boolean {
    return this.activeUserId !== null;
  }

  public async hasActiveSession(): Promise<boolean> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error || !user) {
        this.activeUserId = null;
        this.permisionData.clearData();
        return false;
      }
      const { data: profile, error: profileError } = await this.supabase.from('profiles')
        .select('id').eq('id', user.id).eq('is_active', true).maybeSingle();
      if (profileError || !profile) {
        await this.supabase.auth.signOut();
        this.activeUserId = null;
        this.permisionData.clearData();
        return false;
      }
      this.activeUserId = user.id;
      return true;
    } catch {
      this.activeUserId = null;
      this.permisionData.clearData();
      return false;
    }
  }

  public async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.activeUserId = null;
    this.localStorageService.removeItem(SECURITY.TOKEN);
    this.localStorageService.removeItem(SECURITY.ROUTE_DEFAULT);
    this.permisionData.clearData();
    await this.router.navigate([ROUTES_WEB.LOGIN]);
  }

  public updateMenuItems(): void {
    this.updateMenuItemsAsync().catch(() => this.permisionData.clearData());
  }

  public async updateMenuItemsAsync(): Promise<void> {
    const menu = await firstValueFrom(this.getMenuItems());
    this.permisionData.setData(menu);
  }

  public getMenuItems(): Observable<MenuItemResponse[]> {
    return this.authenticationRepository.getMenuItems().pipe(
      map((response) => response.datos.map((item) => ({ ...item, id: uuidv4() }))),
    );
  }
}
