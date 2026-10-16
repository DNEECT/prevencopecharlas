import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { PermisosDatosResponse } from '../interface/permission';
import { SupabaseService } from '@shared/service/supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionRepository {
  private readonly supabaseService = inject(SupabaseService);

  public listar(codigoRol: string): Observable<PermisosDatosResponse> {
    return from(
      this.supabaseService.invoke<PermisosDatosResponse>('admin-directory', {
        action: 'list-permissions',
        roleId: codigoRol,
      }),
    );
  }
}
