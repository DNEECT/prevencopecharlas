import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private clientInstance?: SupabaseClient;

  public get client(): SupabaseClient {
    if (!this.clientInstance) {
      const { url, publishableKey } = environment.supabase;

      if (!url || !publishableKey) {
        throw new Error(
          'Supabase is not configured. Set the project URL and publishable key in the Angular environment file.',
        );
      }

      this.clientInstance = createClient(url, publishableKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      });
    }

    return this.clientInstance;
  }
}
