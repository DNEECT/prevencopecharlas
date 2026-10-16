import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  const request = {
    datos: {
      numeroDocumento: '12345678',
      nombres: 'Test',
      apellidos: 'User',
      contraseniaOld: 'old-password',
      contraseniaNueva: 'new-password',
      contraseniaNuevaConfirm: 'new-password',
      direccion: null,
      fechaNacimiento: null,
    },
  };
  let repository: UserRepository;
  let signIn: jasmine.Spy;
  let updateUser: jasmine.Spy;
  let updateProfile: jasmine.Spy;
  let invoke: jasmine.Spy;

  beforeEach(() => {
    signIn = jasmine.createSpy('signInWithPassword').and.resolveTo({ error: null });
    updateUser = jasmine.createSpy('updateUser').and.resolveTo({ error: null });
    updateProfile = jasmine.createSpy('updateProfile').and.resolveTo({ error: null });
    invoke = jasmine.createSpy('invoke');
    const client = {
      auth: {
        getUser: jasmine.createSpy('getUser').and.resolveTo({
          data: {
            user: { id: '00000000-0000-4000-8000-000000000101', email: 'user@example.invalid' },
          },
          error: null,
        }),
        signInWithPassword: signIn,
        updateUser,
      },
      from: jasmine.createSpy('from').and.returnValue({
        update: jasmine.createSpy('update').and.returnValue({ eq: updateProfile }),
      }),
    } as unknown as SupabaseClient;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SupabaseService, useValue: { client, invoke } },
      ],
    });
    repository = TestBed.inject(UserRepository);
  });

  it('loads the paginated directory through the authenticated Edge Function', async () => {
    invoke.and.resolveTo({
      usuarios: [],
      totalElementos: 0,
      numeroPagina: 2,
      tamanioPagina: 10,
    });

    const result = await firstValueFrom(repository.listar(2, 10, '  fernandez  '));

    expect(invoke).toHaveBeenCalledWith('admin-directory', {
      action: 'list-users',
      page: 2,
      pageSize: 10,
      search: 'fernandez',
    });
    expect(result.totalElementos).toBe(0);
  });

  it('creates accounts without exposing an administrative credential to the repository', async () => {
    invoke.and.resolveTo({
      datos: { codigo: 'OK', mensaje: 'Usuario creado; invitación pendiente.' },
    });
    const adminRequest = {
      datos: {
        numeroDocumento: '12345678',
        nombres: 'Test',
        apellidos: 'User',
        username: 'test.user',
        correo: 'test@jne.gob.pe',
        direccion: 'Lima',
        fechaNacimiento: '1990-01-01',
        roles: ['00000000-0000-4000-8000-000000000001'],
      },
    };

    const result = await firstValueFrom(repository.crear(adminRequest));

    expect(invoke).toHaveBeenCalledWith('admin-directory', {
      action: 'create-user',
      user: adminRequest.datos,
    });
    expect(result.datos.mensaje).toContain('invitación pendiente');
  });

  it('verifies the old password before changing credentials and profile', async () => {
    const result = await firstValueFrom(repository.actualizarInfo(request));
    expect(result.datos.codigo).toBe('OK');
    expect(signIn).toHaveBeenCalledWith({
      email: 'user@example.invalid',
      password: 'old-password',
    });
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-password' });
    expect(updateProfile).toHaveBeenCalled();
  });

  it('does not change credentials or profile when the old password is wrong', async () => {
    signIn.and.resolveTo({ error: new Error('Invalid login') });
    await expectAsync(firstValueFrom(repository.actualizarInfo(request))).toBeRejectedWithError(
      /contraseña actual/,
    );
    expect(updateUser).not.toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
