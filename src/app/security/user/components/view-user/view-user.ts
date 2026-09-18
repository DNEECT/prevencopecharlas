import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FormFieldAutoCompleteMultiple } from '@shared/components/form-field-auto-complete-multiple/form-field-auto-complete-multiple';
import { FormFieldDateComponent } from '@shared/components/form-field-date/form-field-date.component';
import { FormFieldInputComponent } from '@shared/components/form-field-input/form-field-input.component';
import { UserService } from '../../service/user.service';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import {
  buildUsuarioPasswordRequestFromForm,
  errorMessagesUsuarioPasswordForm,
  UsuarioPasswordForm,
  usuarioPasswordFormGroup,
  UsuarioPasswordRequest,
} from '../../interface/user-password';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { convertirUsuarioResponseToUsuarioFormDto, UsuarioResponse } from '../../interface/user';
import { FormFieldPasswordComponent } from '@shared/components/form-field-password/form-field-password.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-view-user',
  imports: [
    MatButton,
    FormFieldAutoCompleteMultiple,
    FormFieldDateComponent,
    FormFieldInputComponent,
    FormFieldPasswordComponent,
  ],
  templateUrl: './view-user.html',
  styleUrl: './view-user.scss',
})
export class ViewUser implements OnInit, OnDestroy {
  private readonly userService: UserService = inject(UserService);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  public userForm: FormGroup<UsuarioPasswordForm> = usuarioPasswordFormGroup;
  public errorMessagesForm: ErrorFields = errorMessagesUsuarioPasswordForm;

  ngOnInit(): void {
    this.setPageData();
    this.route.data.subscribe((data) => {
      const usuario = data['usuario'] as UsuarioResponse | null;
      if (usuario) {
        const userRequestForm = convertirUsuarioResponseToUsuarioFormDto(usuario);
        this.userForm.patchValue(userRequestForm);
      }
    });
    // @ts-ignore
    this.userForm.patchValue({
      contraseniaOld: '',
      contraseniaNew: '',
      contraseniaConfirm: '',
    } as Partial<UsuarioPasswordForm>);
  }

  ngOnDestroy(): void {}

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([{ name: 'Perfil', path: parentPath }]);
  }

  public updateUser() {
    this.dialogService.openLoadingWindow();
    const usuarioPasswordRequest: UsuarioPasswordRequest = buildUsuarioPasswordRequestFromForm(
      this.userForm,
    );
    this.userService
      .actualizarInfo(usuarioPasswordRequest)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar('Usuario actualizado correctamente');
          // Resetear solo los campos de contraseña
          // @ts-ignore
          this.userForm.patchValue({
            contraseniaOld: '',
            contraseniaNew: '',
            contraseniaConfirm: '',
          } as Partial<UsuarioPasswordForm>);

          // Opcional: marcar el formulario como pristino/no tocado
          this.userForm.markAsPristine();
          this.userForm.markAsUntouched();
        },
      });
  }
}
