import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FormFieldInputComponent } from '@shared/components/form-field-input/form-field-input.component';
import { SupabaseService } from '@shared/service/supabase/supabase.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ErrorField } from '@shared/interface/error-field.interface';

@Component({
  selector: 'app-recover-password',
  imports: [FormFieldInputComponent, MatButton, ReactiveFormsModule, RouterLink],
  templateUrl: './recover-password.html',
  styleUrl: '../login/login.scss',
})
export class RecoverPassword {
  private readonly supabase = inject(SupabaseService).client;
  private readonly snackBar = inject(SnackbarService);

  public readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  public readonly emailErrors: ErrorField[] = [
    { required: 'El correo institucional es obligatorio.' },
    { email: 'Ingrese un correo válido.' },
  ];
  public sending = false;
  public sent = false;

  public async sendRecovery(): Promise<void> {
    if (this.form.invalid || this.sending) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending = true;
    try {
      const redirectTo = `${window.location.origin}/actualizar-contrasena`;
      const { error } = await this.supabase.auth.resetPasswordForEmail(
        this.form.controls.email.value.trim(),
        {
          redirectTo,
        },
      );
      if (error) throw error;
      this.sent = true;
      this.snackBar.openSuccessSnackBar('Revise su correo institucional para continuar.');
    } catch {
      this.sent = true;
      this.snackBar.openSuccessSnackBar(
        'Si la cuenta está habilitada, recibirá un correo para continuar.',
      );
    } finally {
      this.sending = false;
    }
  }
}
