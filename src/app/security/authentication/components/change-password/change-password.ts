import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
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
  private readonly supabase = inject(SupabaseService).client;
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
      const { data: sessionData } = await this.supabase.auth.getSession();
      if (!sessionData.session)
        throw new Error('El enlace venció o no es válido. Solicite uno nuevo.');
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
}
