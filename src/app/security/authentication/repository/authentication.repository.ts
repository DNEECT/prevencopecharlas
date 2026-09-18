import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import {
  LoginDatosRequest,
  LoginDatosResponse,
  MenuItemDatosRespone,
} from '../interface/authentication';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriBaseAuth = `${ROUTES_SERVIDOR_PATH.BASE_URL}`;

  public login(request: LoginDatosRequest): Observable<LoginDatosResponse> {
    return this.apiService.post(`${this.uriBaseAuth}${ROUTES_SERVIDOR_PATH.LOGIN}`, request);
  }

  getMenuItems(): Observable<MenuItemDatosRespone> {
    return this.apiService.get(`${this.uriBaseAuth}${ROUTES_SERVIDOR_PATH.MENUS}`);
  }
}
