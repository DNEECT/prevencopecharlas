import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import { AccionesDatosResponse } from '../interface/permission';

@Injectable({
  providedIn: 'root',
})
export class ActionsRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriAcciones = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.ACCIONES}`;

  public listar(): Observable<AccionesDatosResponse> {
    return this.apiService.get(`${this.uriAcciones}`, {}, {}, {}, true);
  }
}
