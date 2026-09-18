import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import { RolDatosResponse } from '../interface/role';

@Injectable({
  providedIn: 'root',
})
export class RoleRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriRol = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.ROLES}`;

  public listar(): Observable<RolDatosResponse> {
    return this.apiService.get(`${this.uriRol}`, {}, {}, {}, true);
  }
}
