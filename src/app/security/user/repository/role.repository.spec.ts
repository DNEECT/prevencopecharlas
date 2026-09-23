import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { RoleRepository } from './role.repository';
import { SupabaseService } from '@shared/service/supabase/supabase.service';

describe('RoleRepository', () => {
  let repository: RoleRepository;
  let invoke: jasmine.Spy;

  beforeEach(() => {
    invoke = jasmine.createSpy('invoke').and.resolveTo({ datos: [] });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SupabaseService, useValue: { invoke } },
      ],
    });
    repository = TestBed.inject(RoleRepository);
  });

  it('loads roles through the administrative Edge Function', async () => {
    await firstValueFrom(repository.listar());
    expect(invoke).toHaveBeenCalledWith('admin-directory', { action: 'list-roles' });
  });
});
