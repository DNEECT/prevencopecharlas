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
import { firstValueFrom } from 'rxjs';
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

  public async createActivityRegister() {
    if (this.activityRegisterForm.invalid) return;
    this.dialogService.openLoadingWindow();
    const adjuntoListaAsistentes = this.activityRegisterForm.get('adjuntoListaAsistentes')?.value;
    const adjuntoRegistroFotografico = this.activityRegisterForm.get('adjuntoRegistroFotografico')?.value;
    let activityId: string | null = null;
    try {
      const request: RegistroActividadRequest = convertirRegistroActividadFormDtoToRegistroActividadRequest(
        this.activityRegisterForm, this.listDetailsParticipantsRegistro,
      );
      const created = await firstValueFrom(this.activityRegisterService.crear(request));
      activityId = created.codigo;
      if (adjuntoListaAsistentes instanceof File) {
        await firstValueFrom(this.fileService.uploadFile(
          adjuntoListaAsistentes, activityId, 'attendance-list'));
      }
      if (adjuntoRegistroFotografico instanceof File) {
        await firstValueFrom(this.fileService.uploadFile(
          adjuntoRegistroFotografico, activityId, 'photographic-record'));
      }
      this.snackBarService.openSuccessSnackBar('Registro de actividad creado correctamente');
      this.cancelActivityRegister();
    } catch (error) {
      if (activityId) {
        this.snackBarService.openWarningSnackBar(
          'El registro se creó, pero un adjunto falló. Puede reintentarlo al editar.');
        this.router.navigate(['/registro-actividad', activityId]).then();
      } else {
        this.snackBarService.openErrorSnackBar('Error al crear el registro de actividad');
      }
      console.error('Error al guardar registro o adjunto:', error);
    } finally {
      this.dialogService.closeDialog();
      this.cdr.detectChanges();
    }
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
