import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { ROUTES_WEB } from '@shared/const/routes-servidor.const';
import { LocalStorageService } from '@shared/service/local-storage/local-storage.service';
import { PermisionDataService } from '@shared/service/permision-data/permision-data.service';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { AuthenticationRepository } from '../repository/authentication.repository';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let getUser: jasmine.Spy;
  let maybeSingle: jasmine.Spy;
  let signOut: jasmine.Spy;
  let clearData: jasmine.Spy;
  let removeItem: jasmine.Spy;
  let navigate: jasmine.Spy;

  beforeEach(() => {
    getUser = jasmine.createSpy('getUser').and.resolveTo({
      data: { user: { id: '00000000-0000-4000-8000-000000000101' } }, error: null,
    });
    maybeSingle = jasmine.createSpy('maybeSingle').and.resolveTo({
      data: { id: '00000000-0000-4000-8000-000000000101' }, error: null,
    });
    signOut = jasmine.createSpy('signOut').and.resolveTo({ error: null });
    clearData = jasmine.createSpy('clearData');
    removeItem = jasmine.createSpy('removeItem');
    navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    const profileQuery: { eq: jasmine.Spy; maybeSingle: jasmine.Spy } = {
      eq: jasmine.createSpy('eq'), maybeSingle,
    };
    profileQuery.eq.and.returnValue(profileQuery);
    const client = {
      auth: { getUser, signOut },
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(profileQuery),
      }),
    } as unknown as SupabaseClient;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthenticationRepository, useValue: {} },
        { provide: SupabaseService, useValue: { client } },
        { provide: LocalStorageService, useValue: { removeItem, getItem: () => null } },
        { provide: PermisionDataService, useValue: { clearData } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    service = TestBed.inject(AuthenticationService);
  });

  it('recovers a refreshed Auth session only when its profile is active', async () => {
    expect(await service.hasActiveSession()).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
    expect(clearData).not.toHaveBeenCalled();
  });

  it('denies a still-valid Auth session after the application profile is disabled', async () => {
    expect(await service.hasActiveSession()).toBeTrue();
    maybeSingle.and.resolveTo({ data: null, error: null });
    expect(await service.hasActiveSession()).toBeFalse();
    expect(service.isAuthenticated()).toBeFalse();
    expect(signOut).toHaveBeenCalled();
    expect(clearData).toHaveBeenCalled();
  });

  it('clears application access when Auth no longer has a valid session', async () => {
    expect(await service.hasActiveSession()).toBeTrue();
    getUser.and.resolveTo({ data: { user: null }, error: new Error('Expired session') });
    expect(await service.hasActiveSession()).toBeFalse();
    expect(service.isAuthenticated()).toBeFalse();
    expect(clearData).toHaveBeenCalled();
  });

  it('signs out, removes obsolete route and token state, and returns to login', async () => {
    expect(await service.hasActiveSession()).toBeTrue();
    await service.signOut();
    expect(signOut).toHaveBeenCalled();
    expect(service.isAuthenticated()).toBeFalse();
    expect(removeItem).toHaveBeenCalledTimes(2);
    expect(clearData).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith([ROUTES_WEB.LOGIN]);
  });
});
