import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@shared/service/api/api.service';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  const request = {
    datos: {
      numeroDocumento: '12345678', nombres: 'Test', apellidos: 'User',
      contraseniaOld: 'old-password', contraseniaNueva: 'new-password',
      contraseniaNuevaConfirm: 'new-password', direccion: null, fechaNacimiento: null,
    },
  };
  let repository: UserRepository;
  let signIn: jasmine.Spy;
  let updateUser: jasmine.Spy;
  let updateProfile: jasmine.Spy;

  beforeEach(() => {
    signIn = jasmine.createSpy('signInWithPassword').and.resolveTo({ error: null });
    updateUser = jasmine.createSpy('updateUser').and.resolveTo({ error: null });
    updateProfile = jasmine.createSpy('updateProfile').and.resolveTo({ error: null });
    const client = {
      auth: {
        getUser: jasmine.createSpy('getUser').and.resolveTo({
          data: { user: { id: '00000000-0000-4000-8000-000000000101',
                          email: 'user@example.invalid' } }, error: null,
        }),
        signInWithPassword: signIn, updateUser,
      },
      from: jasmine.createSpy('from').and.returnValue({
        update: jasmine.createSpy('update').and.returnValue({ eq: updateProfile }),
      }),
    } as unknown as SupabaseClient;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ApiService, useValue: {} },
        { provide: SupabaseService, useValue: { client } },
      ],
    });
    repository = TestBed.inject(UserRepository);
  });

  it('verifies the old password before changing credentials and profile', async () => {
    const result = await firstValueFrom(repository.actualizarInfo(request));
    expect(result.datos.codigo).toBe('OK');
    expect(signIn).toHaveBeenCalledWith({
      email: 'user@example.invalid', password: 'old-password',
    });
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-password' });
    expect(updateProfile).toHaveBeenCalled();
  });

  it('does not change credentials or profile when the old password is wrong', async () => {
    signIn.and.resolveTo({ error: new Error('Invalid login') });
    await expectAsync(firstValueFrom(repository.actualizarInfo(request)))
      .toBeRejectedWithError(/contraseña actual/);
    expect(updateUser).not.toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
