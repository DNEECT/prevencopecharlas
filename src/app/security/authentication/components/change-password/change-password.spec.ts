import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ChangePassword } from './change-password';

describe('ChangePassword', () => {
  const getSession = jasmine.createSpy('getSession');
  const verifyOtp = jasmine.createSpy('verifyOtp');
  const updateUser = jasmine.createSpy('updateUser');
  const signOut = jasmine.createSpy('signOut');
  const navigate = jasmine.createSpy('navigate');
  const openErrorSnackBar = jasmine.createSpy('openErrorSnackBar');
  const openSuccessSnackBar = jasmine.createSpy('openSuccessSnackBar');

  beforeEach(async () => {
    getSession.and.resolveTo({ data: { session: null }, error: null });
    verifyOtp.and.resolveTo({ data: { session: {} }, error: null });
    updateUser.and.resolveTo({ data: { user: {} }, error: null });
    signOut.and.resolveTo({ error: null });
    navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [ChangePassword],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: SupabaseService,
          useValue: { client: { auth: { getSession, verifyOtp, updateUser, signOut } } },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ token_hash: 'token-hash' }) } },
        },
        { provide: Router, useValue: { navigate } },
        {
          provide: SnackbarService,
          useValue: { openErrorSnackBar, openSuccessSnackBar },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    getSession.calls.reset();
    verifyOtp.calls.reset();
    updateUser.calls.reset();
    signOut.calls.reset();
    navigate.calls.reset();
    openErrorSnackBar.calls.reset();
    openSuccessSnackBar.calls.reset();
  });

  it('exchanges a recovery token hash before changing the password', async () => {
    const fixture = TestBed.createComponent(ChangePassword);
    const component = fixture.componentInstance;
    component.form.setValue({ password: 'new-password', confirmation: 'new-password' });

    await component.updatePassword();

    expect(verifyOtp).toHaveBeenCalledOnceWith({ token_hash: 'token-hash', type: 'recovery' });
    expect(updateUser).toHaveBeenCalledOnceWith({ password: 'new-password' });
    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledOnceWith(['/login']);
    expect(openErrorSnackBar).not.toHaveBeenCalled();
  });
});
