import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConsultRepository } from '@modules/activity-register/repository/consult.repository';
import { RegistroActividadParticipanteResponse } from '@modules/activity-register/interface/activity-register';

@Injectable({
  providedIn: 'root',
})
export class ConsultService {
  private readonly consultaRepository: ConsultRepository = inject(ConsultRepository);

  public consultarParticipante(
    numeroDocumento: string,
  ): Observable<RegistroActividadParticipanteResponse> {
    return this.consultaRepository.consultarParticipante(numeroDocumento);
  }
}
