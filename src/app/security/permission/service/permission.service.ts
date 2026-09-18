import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PermissionRepository } from '../repository/permission.repository';
import { PermisosDatosResponse, PermisosResponse } from '../interface/permission';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly permissionRepository: PermissionRepository = inject(PermissionRepository);

  public select(codigoRol: string): Observable<PermisosResponse[]> {
    return this.permissionRepository.listar(codigoRol).pipe(
      map((response: PermisosDatosResponse) => {
        return response.datos;
      }),
    );
  }
}
