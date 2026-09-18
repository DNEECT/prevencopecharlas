import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FormUser } from '../form-user/form-user';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { finalize } from 'rxjs';
import { UserService } from '../../service/user.service';
import {
  convertirUsuarioFormDtoToUsuarioRequest,
  errorMessagesUsuarioForm,
  UsuarioForm,
  usuarioFormGroup,
  UsuarioRequest,
} from '../../interface/user';

@Component({
  selector: 'app-add-user',
  imports: [MatButton, FormUser],
  templateUrl: './add-user.html',
  styleUrl: './add-user.scss',
})
export class AddUser implements OnInit, OnDestroy {
  private readonly userService: UserService = inject(UserService);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);

  public userForm: FormGroup<UsuarioForm> = usuarioFormGroup;
  public errorMessagesForm: ErrorFields = errorMessagesUsuarioForm;

  ngOnInit(): void {
    this.setPageData();
  }

  ngOnDestroy(): void {
    this.userForm.reset();
  }

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([
      { name: 'Usuario', path: parentPath },
      { name: 'Nuevo', path: currentPath },
    ]);
  }

  public createUser() {
    this.dialogService.openLoadingWindow();
    const request: UsuarioRequest = convertirUsuarioFormDtoToUsuarioRequest(this.userForm);
    this.userService
      .crear(request)
      .pipe(
        finalize(() => {
          this.dialogService.closeDialog();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBarService.openSuccessSnackBar('Usuario creado correctamente');
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
