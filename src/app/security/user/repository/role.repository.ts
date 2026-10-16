import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { RolDatosResponse } from '../interface/role';
import { SupabaseService } from '@shared/service/supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class RoleRepository {
  private readonly supabaseService = inject(SupabaseService);

  public listar(): Observable<RolDatosResponse> {
    return from(
      this.supabaseService.invoke<RolDatosResponse>('admin-directory', {
        action: 'list-roles',
      }),
    );
  }
}
