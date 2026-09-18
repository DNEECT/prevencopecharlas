import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormActivityRegister } from '@modules/activity-register/components/form-activity-register/form-activity-register';
import { MatButton } from '@angular/material/button';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { ActivityRegisterService } from '@modules/activity-register/service/activity-register.service';
import {
  convertirRegistroActividadFormDtoToRegistroActividadRequest,
  errorMessagesRegistroActividadForm,
  RegistroActividadForm,
  registroActividadFormGroup,
  RegistroActividadParticipanteResponseTable,
  RegistroActividadRequest,
} from '@modules/activity-register/interface/activity-register';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import { FileService } from '@modules/activity-register/service/file.service';

@Component({
  selector: 'app-add-activity-register',
  imports: [FormActivityRegister, MatButton],
  templateUrl: './add-activity-register.html',
  styleUrl: './add-activity-register.scss',
})
export class AddActivityRegister implements OnInit, OnDestroy {
  private readonly activityRegisterService: ActivityRegisterService =
    inject(ActivityRegisterService);
  private readonly fileService: FileService = inject(FileService);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);

  public activityRegisterForm: FormGroup<RegistroActividadForm> = registroActividadFormGroup;
  public errorMessagesForm: ErrorFields = errorMessagesRegistroActividadForm;
  public listDetailsParticipantsRegistro: RegistroActividadParticipanteResponseTable[] = [];

  ngOnInit(): void {
    this.setPageData();
  }

  ngOnDestroy(): void {
    this.activityRegisterForm.reset();
    this.listDetailsParticipantsRegistro = [];
  }

  public setPageData() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.breadcrumbsService.setRoot({ name: 'Inicio', path: '/inicio' });
    this.breadcrumbsService.pushPath([
      { name: 'Registro de actividad', path: parentPath },
      { name: 'Nuevo', path: currentPath },
    ]);
  }

  public createActivityRegister() {
    this.dialogService.openLoadingWindow();

    const adjuntoListaAsistentes = this.activityRegisterForm.get('adjuntoListaAsistentes')?.value;
    const adjuntoRegistroFotografico = this.activityRegisterForm.get('adjuntoRegistroFotografico')?.value;

    // Preparar observables para subir archivos
    const uploadListaAsistentes$ = adjuntoListaAsistentes instanceof File
      ? this.fileService.uploadFile(adjuntoListaAsistentes)
      : of(typeof adjuntoListaAsistentes === 'string' ? adjuntoListaAsistentes : null);

    const uploadRegistroFotografico$ = adjuntoRegistroFotografico instanceof File
      ? this.fileService.uploadFile(adjuntoRegistroFotografico)
      : of(typeof adjuntoRegistroFotografico === 'string' ? adjuntoRegistroFotografico : null);

    // Subir archivos primero, luego crear el registro
    forkJoin({
      adjuntoListaAsistentesUrl: uploadListaAsistentes$,
      adjuntoRegistroFotograficoUrl: uploadRegistroFotografico$,
    }).pipe(
      switchMap((urls) => {
        const request: RegistroActividadRequest =
          convertirRegistroActividadFormDtoToRegistroActividadRequest(
            this.activityRegisterForm,
            this.listDetailsParticipantsRegistro,
            urls.adjuntoListaAsistentesUrl,
            urls.adjuntoRegistroFotograficoUrl,
          );
        return this.activityRegisterService.crear(request);
      }),
      finalize(() => {
        this.dialogService.closeDialog();
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: () => {
        this.snackBarService.openSuccessSnackBar('Registro de actividad creado correctamente');
        this.cancelActivityRegister();
      },
      error: (err) => {
        console.error('Error al crear registro:', err);
        this.snackBarService.openErrorSnackBar('Error al crear el registro de actividad');
      },
    });
  }

  public cancelActivityRegister() {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    const parentPath = currentPath.replace(/\/[^/]+\/?$/i, '');
    this.router.navigate([parentPath]).then();
  }

  public onAddParticipant(detail: RegistroActividadParticipanteResponseTable) {
    this.listDetailsParticipantsRegistro = [...this.listDetailsParticipantsRegistro, detail];
    this.cdr.detectChanges();
  }

  public onRemoveParticipant(removed: RegistroActividadParticipanteResponseTable) {
    this.listDetailsParticipantsRegistro = this.listDetailsParticipantsRegistro.filter(
      (item) => item.indice !== removed.indice,
    );
    this.cdr.detectChanges();
  }
}
