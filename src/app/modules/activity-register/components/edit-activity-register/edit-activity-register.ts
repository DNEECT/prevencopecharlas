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
import { finalize, forkJoin, of, switchMap } from 'rxjs';
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

  public createActivityRegister() {
    this.dialogService.openLoadingWindow();

    const adjuntoListaAsistentes = this.activityRegisterForm.get('adjuntoListaAsistentes')?.value;
    const adjuntoRegistroFotografico = this.activityRegisterForm.get('adjuntoRegistroFotografico')?.value;

    // Solo subir si es un File nuevo, de lo contrario mantener la URL original o la existente
    const uploadListaAsistentes$ = adjuntoListaAsistentes instanceof File
      ? this.fileService.uploadFile(adjuntoListaAsistentes)
      : of(typeof adjuntoListaAsistentes === 'string' ? adjuntoListaAsistentes : this.originalAdjuntoListaAsistentes);

    const uploadRegistroFotografico$ = adjuntoRegistroFotografico instanceof File
      ? this.fileService.uploadFile(adjuntoRegistroFotografico)
      : of(typeof adjuntoRegistroFotografico === 'string' ? adjuntoRegistroFotografico : this.originalAdjuntoRegistroFotografico);

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
        return this.activityRegisterService.actualizar(request, this.codigoRegistroActividad);
      }),
      finalize(() => {
        this.dialogService.closeDialog();
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: () => {
        this.snackBarService.openSuccessSnackBar(
          'Registro de actividad actualizado correctamente',
        );
        this.cancelActivityRegister();
      },
      error: (err) => {
        console.error('Error al actualizar registro:', err);
        this.snackBarService.openErrorSnackBar('Error al actualizar el registro de actividad');
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
