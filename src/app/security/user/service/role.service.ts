import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { RoleRepository } from '../repository/role.repository';
import { RolDatosResponse, RolResponse } from '../interface/role';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly roleRepositry: RoleRepository = inject(RoleRepository);

  public select(): Observable<AutoCompleteData[]> {
    return this.roleRepositry.listar().pipe(
      map((response: RolDatosResponse) => {
        return response.datos.map((role: RolResponse) => {
          return {
            key: role.codigoRol,
            value: role.nombre,
          };
        });
      }),
    );
  }
}
