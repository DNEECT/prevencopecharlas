import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { AuthenticationRepository } from './authentication.repository';

describe('AuthenticationRepository', () => {
  const userId = '00000000-0000-4000-8000-000000000101';
  const request = { datos: { usuario: 'user@example.invalid', contrasenia: 'password123' } };
  let repository: AuthenticationRepository;
  let signIn: jasmine.Spy;
  let signOut: jasmine.Spy;
  let maybeSingle: jasmine.Spy;
  let rpc: jasmine.Spy;

  beforeEach(() => {
    signIn = jasmine.createSpy('signInWithPassword').and.resolveTo({
      data: { user: { id: userId }, session: { access_token: 'private-access-token' } },
      error: null,
    });
    signOut = jasmine.createSpy('signOut').and.resolveTo({ error: null });
    maybeSingle = jasmine
      .createSpy('maybeSingle')
      .and.resolveTo({ data: { id: userId }, error: null });
    const profileQuery: { eq: jasmine.Spy; maybeSingle: jasmine.Spy } = {
      eq: jasmine.createSpy('eq'),
      maybeSingle,
    };
    profileQuery.eq.and.returnValue(profileQuery);
    rpc = jasmine.createSpy('rpc').and.resolveTo({
      data: [
        {
          module_id: '00000000-0000-4000-8000-000000000102',
          parent_module_id: null,
          module_abbreviation: 'GREGACT',
          module_name: 'Registro de actividades',
          route: null,
          icon: null,
          sort_order: 1,
          action_abbreviation: 'LIST',
        },
      ],
      error: null,
    });
    const client = {
      auth: { signInWithPassword: signIn, signOut },
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(profileQuery),
      }),
      rpc,
    } as unknown as SupabaseClient;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SupabaseService, useValue: { client } },
      ],
    });
    repository = TestBed.inject(AuthenticationRepository);
  });

  it('accepts an active profile with LIST permission without returning an access token', async () => {
    const result = await firstValueFrom(repository.login(request));
    expect(result.datos.pathDefault).toContain('registro');
    expect(JSON.stringify(result)).not.toContain('private-access-token');
    expect(signOut).not.toHaveBeenCalled();
  });

  it('marks permitted navigation items as visible', async () => {
    const result = await firstValueFrom(repository.getMenuItems());

    expect(result.datos[0].abreviatura).toBe('GREGACT');
    expect(result.datos[0].isVisible).toBeTrue();
  });

  it('groups permitted child routes under hierarchy-only parent menus', async () => {
    rpc.and.resolveTo({
      data: [
        {
          module_id: '00000000-0000-4000-8000-000000000110',
          parent_module_id: null,
          module_abbreviation: 'GADM',
          module_name: 'Administración',
          route: null,
          icon: 'list_alt',
          sort_order: 2,
          action_abbreviation: 'LIST',
        },
        {
          module_id: '00000000-0000-4000-8000-000000000111',
          parent_module_id: '00000000-0000-4000-8000-000000000110',
          module_abbreviation: 'GFORACT',
          module_name: 'Formato de actividad',
          route: '/formato-actividad',
          icon: null,
          sort_order: 1,
          action_abbreviation: 'LIST',
        },
      ],
      error: null,
    });

    const result = await firstValueFrom(repository.getMenuItems());

    expect(result.datos.length).toBe(1);
    expect(result.datos[0].title).toBe('Administración');
    expect(result.datos[0].link).toBeUndefined();
    expect(result.datos[0].items?.map((item) => item.abreviatura)).toEqual(['GFORACT']);
    expect(result.datos[0].items?.[0].link).toBe('/formato-actividad');
  });

  it('rejects invalid credentials before querying application data', async () => {
    signIn.and.resolveTo({
      data: { user: null, session: null },
      error: new Error('Invalid login'),
    });
    await expectAsync(firstValueFrom(repository.login(request))).toBeRejectedWithError(
      'Invalid login',
    );
    expect(maybeSingle).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('signs out an identity with no active application profile', async () => {
    maybeSingle.and.resolveTo({ data: null, error: null });
    await expectAsync(firstValueFrom(repository.login(request))).toBeRejectedWithError(
      /perfil activo/,
    );
    expect(signOut).toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('signs out an identity whose active role grants no navigation', async () => {
    rpc.and.resolveTo({ data: [], error: null });
    await expectAsync(firstValueFrom(repository.login(request))).toBeRejectedWithError(
      /permisos activos/,
    );
    expect(signOut).toHaveBeenCalled();
  });
});
