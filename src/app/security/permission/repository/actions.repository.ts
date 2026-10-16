import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { AccionesDatosResponse } from '../interface/permission';
import { SupabaseService } from '@shared/service/supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ActionsRepository {
  private readonly supabaseService = inject(SupabaseService);

  public listar(): Observable<AccionesDatosResponse> {
    return from(
      this.supabaseService.invoke<AccionesDatosResponse>('admin-directory', {
        action: 'list-actions',
      }),
    );
  }
}
