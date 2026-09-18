import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/service/api/api.service';
import { ROUTES_SERVIDOR_PATH } from '@shared/const/routes-servidor.const';
import { Observable } from 'rxjs';
import { JuradoNacionalEspecialDatosResponse } from '@modules/activity-register/interface/specialnationaljury';

@Injectable({
  providedIn: 'root',
})
export class SpecialnationaljuryRepository {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly uriJuradoNacionalEspecial = `${ROUTES_SERVIDOR_PATH.BASE_URL}${ROUTES_SERVIDOR_PATH.JURADO_NACIONAL_ESPECIAL}`;

  public listar(): Observable<JuradoNacionalEspecialDatosResponse> {
    return this.apiService.get(`${this.uriJuradoNacionalEspecial}`, {}, {}, {}, true);
  }
}
