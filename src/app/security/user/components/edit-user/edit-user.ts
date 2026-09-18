import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FormUser } from '../form-user/form-user';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { finalize } from 'rxjs';
import { UserService } from '../../service/user.service';
import {
  convertirUsuarioFormDtoToUsuarioRequest,
  convertirUsuarioResponseToUsuarioFormDto,
  errorMessagesUsuarioForm,
  UsuarioForm,
  usuarioFormGroup,
  UsuarioRequest,
  UsuarioResponse,
} from '../../interface/user';

@Component({
  selector: 'app-edit-user',
  imports: [MatButton, FormUser],
  templateUrl: './edit-user.html',
  styleUrl: './edit-user.scss',
})
export class EditUser implements OnInit, OnDestroy {
  private readonly userService: UserService = inject(UserService);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  public userForm: FormGroup<UsuarioForm> = usuarioFormGroup;
  public errorMessagesForm: ErrorFields = errorMessagesUsuarioForm;

  private codigoUsuario: string = '';

  ngOnInit(): void {
    this.setPageData();
    this.route.data.subscribe((data) => {
      const usuario = data['usuario'] as UsuarioResponse | null;
      if (usuario) {
        this.codigoUsuario = usuario.codigoUsuario;
        const userRequestForm = convertirUsuarioResponseToUsuarioFormDto(usuario);
        this.userForm.patchValue(userRequestForm);
      }
    });
  }

  ngOnDestroy(): void {}

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([
      { name: 'Usuario', path: parentPath },
      { name: 'Editar', path: currentPath },
    ]);
  }

  public updateUser() {
    this.dialogService.openLoadingWindow();
    const request: UsuarioRequest = convertirUsuarioFormDtoToUsuarioRequest(this.userForm);
    this.userService
      .actualizar(request, this.codigoUsuario)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar('Usuario actualizado correctamente');
          this.cancelUser();
        },
      });
  }

  public cancelUser() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.router.navigate([parentPath]).then();
  }
}
