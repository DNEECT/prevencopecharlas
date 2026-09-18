import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import { ProcesoElectoralDatosResponse } from '@modules/activity-register/interface/electoralprocess';

@Injectable({
  providedIn: 'root',
})
export class ElectoralprocessRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriProcesoElectoral = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.PROCESOS_ELECTORALES}`;

  public listar(): Observable<ProcesoElectoralDatosResponse> {
    return this.apiService.get(`${this.uriProcesoElectoral}`, {}, {}, {}, true);
  }
}
