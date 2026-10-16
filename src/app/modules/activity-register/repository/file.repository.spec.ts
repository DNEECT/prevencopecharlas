import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { FileRepository } from './file.repository';

function insertResult(result: unknown) {
  const query: any = {};
  query.insert = jasmine.createSpy('insert').and.returnValue(query);
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

describe('FileRepository', () => {
  const activityId = '11111111-1111-4111-8111-111111111111';
  let repository: FileRepository;
  let client: any;
  let bucket: any;
  let metadata: any;

  beforeEach(() => {
    bucket = {
      upload: jasmine.createSpy('upload').and.resolveTo({ error: null }),
      remove: jasmine.createSpy('remove').and.resolveTo({ error: null }),
      createSignedUrl: jasmine.createSpy('createSignedUrl'),
    };
    metadata = insertResult({ error: null });
    client = {
      storage: { from: jasmine.createSpy('storage.from').and.returnValue(bucket) },
      from: jasmine.createSpy('from').and.returnValue(metadata),
      rpc: jasmine.createSpy('rpc').and.resolveTo({ error: null }),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        FileRepository,
        { provide: SupabaseService, useValue: { client } },
      ],
    });
    repository = TestBed.inject(FileRepository);
  });

  it('uploads a private object and creates matching metadata', async () => {
    const file = new File(['contenido'], 'lista de asistentes.pdf', { type: 'application/pdf' });

    const path = await firstValueFrom(repository.upload(file, activityId, 'attendance-list'));

    expect(path).toMatch(new RegExp(`^${activityId}/attendance-list/[0-9a-f-]+-lista_de_asistentes\\.pdf$`));
    expect(bucket.upload).toHaveBeenCalledWith(path, file, {
      contentType: 'application/pdf', upsert: false,
    });
    expect(metadata.insert).toHaveBeenCalledWith({
      activity_id: activityId,
      kind: 'attendance-list',
      object_path: path,
      original_name: 'lista de asistentes.pdf',
      mime_type: 'application/pdf',
      byte_size: file.size,
      is_available: true,
    });
  });

  it('rejects invalid photographic types and oversized files before upload', async () => {
    const pdf = new File(['x'], 'foto.pdf', { type: 'application/pdf' });
    const oversized = {
      name: 'lista.pdf', type: 'application/pdf', size: 20 * 1024 * 1024 + 1,
    } as File;

    await expectAsync(firstValueFrom(
      repository.upload(pdf, activityId, 'photographic-record'),
    )).toBeRejectedWithError('El tipo de archivo no es válido para este adjunto.');
    await expectAsync(firstValueFrom(
      repository.upload(oversized, activityId, 'attendance-list'),
    )).toBeRejectedWithError('El archivo supera 20 MiB.');
    expect(bucket.upload).not.toHaveBeenCalled();
  });

  it('removes a newly uploaded object when metadata creation fails', async () => {
    const metadataError = new Error('metadata failed');
    metadata.then = (resolve: (value: unknown) => unknown) => Promise.resolve({
      error: metadataError,
    }).then(resolve);
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });

    await expectAsync(firstValueFrom(
      repository.upload(file, activityId, 'photographic-record'),
    )).toBeRejectedWith(metadataError);

    const uploadedPath = bucket.upload.calls.mostRecent().args[0];
    expect(bucket.remove).toHaveBeenCalledWith([uploadedPath]);
  });

  it('archives the previous metadata and removes its object after replacement', async () => {
    const previousPath = `${activityId}/photographic-record/old-foto.jpg`;
    const file = new File(['nuevo'], 'foto.jpg', { type: 'image/jpeg' });

    const path = await firstValueFrom(repository.replace(
      file, activityId, 'photographic-record', previousPath,
    ));

    expect(client.rpc).toHaveBeenCalledWith('archive_evidence', {
      p_activity_id: activityId, p_object_path: previousPath,
    });
    expect(bucket.remove).toHaveBeenCalledWith([previousPath]);
    expect(path).not.toBe(previousPath);
  });

  it('cleans the replacement object if archiving the previous metadata fails', async () => {
    const archiveError = new Error('archive failed');
    client.rpc.and.callFake((_name: string, args: { p_object_path: string }) =>
      Promise.resolve(args.p_object_path.endsWith('old.jpg')
        ? { error: archiveError } : { error: null }));
    const previousPath = `${activityId}/photographic-record/old.jpg`;
    const file = new File(['nuevo'], 'foto.jpg', { type: 'image/jpeg' });

    await expectAsync(firstValueFrom(repository.replace(
      file, activityId, 'photographic-record', previousPath,
    ))).toBeRejectedWith(archiveError);

    const newPath = metadata.insert.calls.mostRecent().args[0].object_path;
    expect(client.rpc).toHaveBeenCalledWith('archive_evidence', {
      p_activity_id: activityId, p_object_path: newPath,
    });
    expect(bucket.remove).toHaveBeenCalledWith([newPath]);
  });

  it('archives metadata before deleting and downloads only through a signed URL', async () => {
    const path = `${activityId}/attendance-list/lista.pdf`;
    await firstValueFrom(repository.remove(activityId, path));
    expect(client.rpc).toHaveBeenCalledWith('archive_evidence', {
      p_activity_id: activityId, p_object_path: path,
    });
    expect(bucket.remove).toHaveBeenCalledWith([path]);

    const expected = new Blob(['archivo'], { type: 'application/pdf' });
    bucket.createSignedUrl.and.resolveTo({
      data: { signedUrl: 'https://storage.example/signed' }, error: null,
    });
    spyOn(globalThis, 'fetch').and.resolveTo({
      ok: true, blob: () => Promise.resolve(expected),
    } as Response);

    const downloaded = await firstValueFrom(repository.download(path));

    expect(bucket.createSignedUrl).toHaveBeenCalledWith(path, 60);
    expect(globalThis.fetch).toHaveBeenCalledWith('https://storage.example/signed');
    expect(downloaded).toBe(expected);
  });
});
