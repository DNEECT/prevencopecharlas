import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from '@shared/service/supabase/supabase.service';

export type EvidenceKind = 'attendance-list' | 'photographic-record';
const BUCKET = 'activity-evidence';
const MIME: Record<string, string> = {
  pdf: 'application/pdf', xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
};

@Injectable({ providedIn: 'root' })
export class FileRepository {
  private readonly supabaseService = inject(SupabaseService);
  private get client() { return this.supabaseService.client; }

  public upload(file: File, activityId: string, kind: EvidenceKind): Observable<string> {
    return from(this.uploadObject(file, activityId, kind));
  }

  private async uploadObject(file: File, activityId: string, kind: EvidenceKind): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mime = MIME[ext];
    if (!mime || (kind === 'photographic-record' && !['png', 'jpg', 'jpeg'].includes(ext))
        || (file.type && file.type !== mime)) {
      throw new Error('El tipo de archivo no es válido para este adjunto.');
    }
    if (file.size > 20 * 1024 * 1024) throw new Error('El archivo supera 20 MiB.');
    const stem = file.name.slice(0, -(ext.length + 1)).normalize('NFKD')
      .replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 70) || 'archivo';
    const path = `${activityId}/${kind}/${uuidv4()}-${stem}.${ext}`;
    const { error: uploadError } = await this.client.storage.from(BUCKET)
      .upload(path, file, { contentType: mime, upsert: false });
    if (uploadError) throw uploadError;
    const { error: metadataError } = await this.client.from('activity_evidence').insert({
      activity_id: activityId, kind, object_path: path,
      original_name: file.name, mime_type: mime, byte_size: file.size, is_available: true,
    });
    if (metadataError) {
      await this.client.storage.from(BUCKET).remove([path]);
      throw metadataError;
    }
    return path;
  }

  public replace(file: File, activityId: string, kind: EvidenceKind,
    previousPath: string | null): Observable<string> {
    return from((async () => {
      const path = await this.uploadObject(file, activityId, kind);
      if (!previousPath) return path;
      try {
        await this.archiveMetadata(activityId, previousPath);
      } catch (error) {
        await this.archiveMetadata(activityId, path).catch(() => {});
        await this.client.storage.from(BUCKET).remove([path]);
        throw error;
      }
      const { error: removalError } = await this.client.storage.from(BUCKET).remove([previousPath]);
      if (removalError) console.warn('An archived evidence object needs orphan cleanup.');
      return path;
    })());
  }

  public remove(activityId: string, path: string): Observable<void> {
    return from((async () => {
      await this.archiveMetadata(activityId, path);
      const { error } = await this.client.storage.from(BUCKET).remove([path]);
      if (error) {
        console.warn('An archived evidence object needs orphan cleanup.');
      }
    })());
  }

  private async archiveMetadata(activityId: string, path: string): Promise<void> {
    const { error } = await this.client.rpc('archive_evidence', {
      p_activity_id: activityId, p_object_path: path,
    });
    if (error) throw error;
  }

  public download(path: string): Observable<Blob> {
    return from((async () => {
      if (!/^[0-9a-f-]{36}\/(attendance-list|photographic-record)\/[^/]+$/.test(path)) {
        throw new Error('El adjunto no tiene una ruta válida.');
      }
      const { data, error } = await this.client.storage.from(BUCKET).createSignedUrl(path, 60);
      if (error || !data) throw error ?? new Error('El archivo no está disponible.');
      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error('El archivo no está disponible.');
      return response.blob();
    })());
  }
}
