import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import { PublicoObjetivoDatosResponse } from '@modules/activity-format/interface/target-audience';

@Injectable({
  providedIn: 'root',
})
export class TargetAudienceRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriPublicoObjetivo = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.PUBLICO_OBJETIVO}`;

  public listar(): Observable<PublicoObjetivoDatosResponse> {
    return this.apiService.get(`${this.uriPublicoObjetivo}`, {}, {}, {}, true);
  }
}
