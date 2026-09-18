import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import { TipoAsistenteDatosResponse } from '@modules/activity-format/interface/asistent-type';

@Injectable({
  providedIn: 'root',
})
export class AsistentTypeRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriTipoAsistente = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.TIPO_ASISTENTES}`;

  public listar(): Observable<TipoAsistenteDatosResponse> {
    return this.apiService.get(`${this.uriTipoAsistente}`, {}, {}, {}, true);
  }
}
