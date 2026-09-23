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

  public async invoke<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.client.functions.invoke<T>(functionName, { body });
    if (error) {
      let message = error.message;
      const context = (error as unknown as { context?: Response }).context;
      if (context) {
        try {
          const payload = (await context.clone().json()) as { error?: string; message?: string };
          message = payload.error ?? payload.message ?? message;
        } catch {
          // Preserve the SDK error when the response is not JSON.
        }
      }
      throw new Error(message);
    }
    if (data === null) throw new Error('La función no devolvió una respuesta.');
    return data;
  }
}
