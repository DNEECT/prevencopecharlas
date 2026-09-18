import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import { RegistroActividadParticipanteResponse } from '@modules/activity-register/interface/activity-register';

@Injectable({
  providedIn: 'root',
})
export class ConsultRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriConsultas = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.CONSULTAS}`;

  public consultarParticipante(
    numeroDocumento: string,
  ): Observable<RegistroActividadParticipanteResponse> {
    return this.apiService.get(`${this.uriConsultas}/dni/${numeroDocumento}`);
  }
}
