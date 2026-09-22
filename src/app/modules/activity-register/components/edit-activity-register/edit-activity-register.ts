import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormActivityRegister } from '@modules/activity-register/components/form-activity-register/form-activity-register';
import { MatButton } from '@angular/material/button';
import {
  convertirRegistroActividadFormDtoToRegistroActividadRequest,
  convertirRegistroActividadResponseToRegistroActividadFormDto,
  errorMessagesRegistroActividadForm,
  RegistroActividadForm,
  registroActividadFormGroup,
  RegistroActividadParticipanteResponse,
  RegistroActividadParticipanteResponseTable,
  RegistroActividadRequest,
  RegistroActividadResponse,
} from '@modules/activity-register/interface/activity-register';
import { ActivityRegisterService } from '@modules/activity-register/service/activity-register.service';
import { BreadcrumbsService } from '@shared/service/breadcrumbs/breadcrumbs-service';
import { DialogService } from '@shared/service/dialog/dialog.service';
import { SnackbarService } from '@shared/service/snackbar/snackbar.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { firstValueFrom } from 'rxjs';
import { MENU_ACTIONS_ITEM } from '@shared/const/menu-acciones.const';
import { FileService } from '@modules/activity-register/service/file.service';

@Component({
  selector: 'app-edit-activity-register',
  imports: [FormActivityRegister, MatButton],
  templateUrl: './edit-activity-register.html',
  styleUrl: './edit-activity-register.scss',
})
export class EditActivityRegister implements OnInit, OnDestroy {
  private readonly activityRegisterService: ActivityRegisterService =
    inject(ActivityRegisterService);
  private readonly fileService: FileService = inject(FileService);
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly snackBarService: SnackbarService = inject(SnackbarService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  public activityRegisterForm: FormGroup<RegistroActividadForm> = registroActividadFormGroup;
  public errorMessagesForm: ErrorFields = errorMessagesRegistroActividadForm;
  public listDetailsParticipantsRegistro: RegistroActividadParticipanteResponseTable[] = [];

  public codigo: string = '';
  private codigoRegistroActividad: string = '';

  // URLs originales de los adjuntos para comparar si cambiaron
  private originalAdjuntoListaAsistentes: string | null = null;
  private originalAdjuntoRegistroFotografico: string | null = null;
  public adjuntoListaAsistentesNoDisponible: string | null = null;
  public adjuntoRegistroFotograficoNoDisponible: string | null = null;

  ngOnInit(): void {
    this.setPageData();
    this.route.data.subscribe((data) => {
      const registroActividad = data['registroActividad'] as RegistroActividadResponse | null;
      if (registroActividad) {
        this.codigoRegistroActividad = registroActividad.codigoRegistroActividad;
        this.codigo = registroActividad.codigo;

        // Guardar URLs originales de los adjuntos
        this.originalAdjuntoListaAsistentes = registroActividad.adjuntoListaAsistentes ?? null;
        this.originalAdjuntoRegistroFotografico = registroActividad.adjuntoRegistroFotografico ?? null;
        this.adjuntoListaAsistentesNoDisponible =
          registroActividad.adjuntoListaAsistentesNoDisponible ?? null;
        this.adjuntoRegistroFotograficoNoDisponible =
          registroActividad.adjuntoRegistroFotograficoNoDisponible ?? null;

        this.activityRegisterForm.patchValue(
          convertirRegistroActividadResponseToRegistroActividadFormDto(registroActividad),
        );
        const participantes = registroActividad.participantes ?? [];
        this.listDetailsParticipantsRegistro = participantes.map(
          (item: RegistroActividadParticipanteResponse, index: number) => {
            return {
              ...item,
              indice: index + 1,
              isIndigena: item.poblacion === 'Indígena',
              isDiscapacitado: item.poblacion === 'Personas con discapacidad',
              isAfroPeruano: item.poblacion === 'Afro-Peruana',
              opciones: [MENU_ACTIONS_ITEM.DELETE],
            };
          },
        );
      }
    });
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
      { name: 'Editar', path: currentPath },
    ]);
  }

  public async createActivityRegister() {
    if (this.activityRegisterForm.invalid) return;
    this.dialogService.openLoadingWindow();
    const adjuntoListaAsistentes = this.activityRegisterForm.get('adjuntoListaAsistentes')?.value;
    const adjuntoRegistroFotografico = this.activityRegisterForm.get('adjuntoRegistroFotografico')?.value;
    let updated = false;
    try {
      const request: RegistroActividadRequest = convertirRegistroActividadFormDtoToRegistroActividadRequest(
        this.activityRegisterForm, this.listDetailsParticipantsRegistro,
      );
      await firstValueFrom(this.activityRegisterService.actualizar(request, this.codigoRegistroActividad));
      updated = true;
      if (adjuntoListaAsistentes instanceof File) {
        const path = await firstValueFrom(this.fileService.replaceFile(
          adjuntoListaAsistentes, this.codigoRegistroActividad, 'attendance-list',
          this.originalAdjuntoListaAsistentes));
        this.originalAdjuntoListaAsistentes = path;
        this.adjuntoListaAsistentesNoDisponible = null;
        this.activityRegisterForm.controls.adjuntoListaAsistentes.setValue(path);
      } else if (adjuntoListaAsistentes == null && this.originalAdjuntoListaAsistentes) {
        await firstValueFrom(this.fileService.removeFile(
          this.codigoRegistroActividad, this.originalAdjuntoListaAsistentes));
        this.originalAdjuntoListaAsistentes = null;
      }
      if (adjuntoRegistroFotografico instanceof File) {
        const path = await firstValueFrom(this.fileService.replaceFile(
          adjuntoRegistroFotografico, this.codigoRegistroActividad, 'photographic-record',
          this.originalAdjuntoRegistroFotografico));
        this.originalAdjuntoRegistroFotografico = path;
        this.adjuntoRegistroFotograficoNoDisponible = null;
        this.activityRegisterForm.controls.adjuntoRegistroFotografico.setValue(path);
      } else if (adjuntoRegistroFotografico == null && this.originalAdjuntoRegistroFotografico) {
        await firstValueFrom(this.fileService.removeFile(
          this.codigoRegistroActividad, this.originalAdjuntoRegistroFotografico));
        this.originalAdjuntoRegistroFotografico = null;
      }
      this.snackBarService.openSuccessSnackBar('Registro de actividad actualizado correctamente');
      this.cancelActivityRegister();
    } catch (error) {
      this.snackBarService.openErrorSnackBar(updated
        ? 'Los datos se guardaron, pero un adjunto falló. Reintente el archivo.'
        : 'Error al actualizar el registro de actividad');
      console.error('Error al actualizar registro o adjunto:', error);
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
