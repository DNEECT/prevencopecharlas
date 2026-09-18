import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import { PermisosDatosResponse } from '../interface/permission';

@Injectable({
  providedIn: 'root',
})
export class PermissionRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriPermisos = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.PERMISOS}`;

  public listar(codigoRol: string): Observable<PermisosDatosResponse> {
    return this.apiService.get(`${this.uriPermisos}/${codigoRol}`, {}, {}, {}, false);
  }
}
