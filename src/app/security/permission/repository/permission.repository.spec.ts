import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { PermissionRepository } from './permission.repository';
import { SupabaseService } from '@shared/service/supabase/supabase.service';

describe('PermissionRepository', () => {
  let repository: PermissionRepository;
  let invoke: jasmine.Spy;

  beforeEach(() => {
    invoke = jasmine.createSpy('invoke').and.resolveTo({ datos: [] });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SupabaseService, useValue: { invoke } },
      ],
    });
    repository = TestBed.inject(PermissionRepository);
  });

  it('loads a role permission matrix through the administrative Edge Function', async () => {
    const roleId = '00000000-0000-4000-8000-000000000001';
    await firstValueFrom(repository.listar(roleId));
    expect(invoke).toHaveBeenCalledWith('admin-directory', {
      action: 'list-permissions',
      roleId,
    });
  });
});
