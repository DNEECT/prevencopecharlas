import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ActionsRepository } from '../repository/actions.repository';
import { AccionesDatosResponse, AccionesResponse } from '../interface/permission';

@Injectable({
  providedIn: 'root',
})
export class ActionsService {
  private readonly actionsRepository: ActionsRepository = inject(ActionsRepository);

  public select(): Observable<AccionesResponse[]> {
    return this.actionsRepository.listar().pipe(
      map((response: AccionesDatosResponse) => {
        return response.datos;
      }),
    );
  }
}
