import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { FormFieldPasswordComponent } from '@shared/components/form-field-password/form-field-password.component';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ErrorField } from '@shared/interface/error-field.interface';

@Component({
  selector: 'app-change-password',
  imports: [FormFieldPasswordComponent, MatButton, ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrl: '../login/login.scss',
})
export class ChangePassword {
  private readonly recoverySessionFromUrl = this.readRecoverySessionFromUrl();
  private readonly supabase = inject(SupabaseService).client;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(SnackbarService);

  public readonly form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });
  public readonly passwordErrors: ErrorField[] = [
    { required: 'La contraseña es obligatoria.' },
    { minlength: 'La contraseña debe tener al menos 8 caracteres.' },
  ];
  public saving = false;

  public async updatePassword(): Promise<void> {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.controls.password.value !== this.form.controls.confirmation.value) {
      this.snackBar.openErrorSnackBar('Las contraseñas no coinciden.');
      return;
    }
    this.saving = true;
    try {
      await this.ensureRecoverySession();
      const { error } = await this.supabase.auth.updateUser({
        password: this.form.controls.password.value,
      });
      if (error) throw error;
      await this.supabase.auth.signOut();
      this.snackBar.openSuccessSnackBar('Contraseña actualizada. Ya puede iniciar sesión.');
      await this.router.navigate(['/login']);
    } catch (error) {
      this.snackBar.openErrorSnackBar(
        error instanceof Error ? error.message : 'No se pudo actualizar la contraseña.',
      );
    } finally {
      this.saving = false;
    }
  }

  private async ensureRecoverySession(): Promise<void> {
    if (this.recoverySessionFromUrl) {
      const { data: recoveredSession, error: recoveryError } = await this.supabase.auth.setSession(
        this.recoverySessionFromUrl,
      );
      if (!recoveryError && recoveredSession.session) return;
    }

    const tokenHash = this.route.snapshot.queryParamMap.get('token_hash')?.trim();
    if (!tokenHash) throw new Error('El enlace venció o no es válido. Solicite uno nuevo.');

    const { data: verificationData, error: verificationError } = await this.supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });
    if (verificationError || !verificationData.session) {
      throw new Error('El enlace venció o no es válido. Solicite uno nuevo.');
    }
  }

  private readRecoverySessionFromUrl(): { access_token: string; refresh_token: string } | null {
    if (typeof window === 'undefined' || !window.location.hash) return null;

    const parameters = new URLSearchParams(window.location.hash.slice(1));
    if (parameters.get('type') !== 'recovery') return null;
    const accessToken = parameters.get('access_token')?.trim();
    const refreshToken = parameters.get('refresh_token')?.trim();
    if (!accessToken || !refreshToken) return null;

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
