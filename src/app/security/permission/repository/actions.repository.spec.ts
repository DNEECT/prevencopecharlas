import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ActionsRepository } from './actions.repository';
import { SupabaseService } from '@shared/service/supabase/supabase.service';

describe('ActionsRepository', () => {
  let repository: ActionsRepository;
  let invoke: jasmine.Spy;

  beforeEach(() => {
    invoke = jasmine.createSpy('invoke').and.resolveTo({ datos: [] });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SupabaseService, useValue: { invoke } },
      ],
    });
    repository = TestBed.inject(ActionsRepository);
  });

  it('loads permission actions through the administrative Edge Function', async () => {
    await firstValueFrom(repository.listar());
    expect(invoke).toHaveBeenCalledWith('admin-directory', { action: 'list-actions' });
  });
});
