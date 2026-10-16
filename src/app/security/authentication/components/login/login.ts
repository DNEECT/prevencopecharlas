import { AfterContentInit, Component, inject, OnInit } from '@angular/core';
import { FormFieldInputComponent } from '@shared/components/form-field-input/form-field-input.component';
import { FormFieldPasswordComponent } from '@shared/components/form-field-password/form-field-password.component';
import { MatButton } from '@angular/material/button';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import {
  errorMessagesLoginForm,
  LoginForm,
  loginFormGroup,
  LoginRequest,
  LoginResponse,
} from '../../interface/authentication';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { AuthenticationService } from '../../service/authentication.service';
import { Router } from '@angular/router';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { finalize } from 'rxjs';
import { MatAutocompleteOrigin } from '@angular/material/autocomplete';

@Component({
  selector: 'app-login',
  imports: [
    FormFieldInputComponent,
    FormFieldPasswordComponent,
    MatButton,
    ReactiveFormsModule,
    NgOptimizedImage,
    MatAutocompleteOrigin,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit, AfterContentInit {
  private readonly authenticationService: AuthenticationService = inject(AuthenticationService);
  private readonly router: Router = inject(Router);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly dialogService: DialogService = inject(DialogService);

  public loginForm: FormGroup<LoginForm> = loginFormGroup;
  public errorMessagesForm: ErrorFields = errorMessagesLoginForm;

  ngOnInit(): void {
    this.isAuthenticating();
  }

  ngAfterContentInit(): void {
    this.isAuthenticating();
  }

  private isAuthenticating(): void {
    this.authenticationService.hasActiveSession().then((active) => {
      if (active) this.router.navigate([this.authenticationService.getRouteDefault()]).then();
    });
  }

  public login() {
    if (this.loginForm.valid) {
      this.dialogService.openLoadingWindow();
      const loginRequest: LoginRequest = {
        usuario: this.loginForm.value.usuario,
        contrasenia: this.loginForm.value.contrasenia,
      };

      this.authenticationService
        .login(loginRequest)
        .pipe(
          finalize(() => {
            this.dialogService.closeDialog();
          }),
        )
        .subscribe({
          next: async (response: LoginResponse) => {
            this.snackBarService.openSuccessSnackBar('Inicio de sesión exitoso');
            this.authenticationService.setUsuarioLogueado(response);
            if (await this.authenticationService.hasActiveSession()) {
              this.router.navigate([response.pathDefault]).then();
            }
          },
          error: (error: Error) => {
            this.snackBarService.openErrorSnackBar(error.message || 'No se pudo iniciar sesión');
          },
        });
    }
  }
}
