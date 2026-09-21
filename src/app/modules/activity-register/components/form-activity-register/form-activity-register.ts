import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormFieldAutoCompleteComponent } from '@shared/components/form-field-auto-complete/form-field-auto-complete.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormFieldInputComponent } from '@shared/components/form-field-input/form-field-input.component';
import { FormFieldDateComponent } from '@shared/components/form-field-date/form-field-date.component';
import { FormFieldTextAreaComponent } from '@shared/components/form-field-text-area/form-field-text-area.component';
import { FormFieldTimeComponent } from '@shared/components/form-field-time/form-field-time.component';
import { MatButton } from '@angular/material/button';
import { TablePaginateComponent } from '@shared/components/table-paginate/table-paginate.component';
import { HeaderTable, MenuItems } from '@shared/interface/header-table.interface';
import { FormGroup } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { ElectoralprocessService } from '@modules/activity-register/service/electoralprocess.service';
import { ActivityFormatService } from '@modules/activity-format/service/activity-format.service';
import {
  convertirRegistroActividadParticipanteFormToRegistroActividadParticipanteResponseTable,
  errorMessagesRegistroActividadForm,
  errorMessagesRegistroParticipanteForm,
  formatoParticipanteFormGroup,
  RegistroActividadForm,
  registroActividadFormGroup,
  RegistroActividadParticipanteForm,
  RegistroActividadParticipanteResponse,
  RegistroActividadParticipanteResponseTable,
} from '@modules/activity-register/interface/activity-register';
import { finalize } from 'rxjs';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { FormatoActividadResponse } from '@modules/activity-format/interface/activity-format';
import { ConsultService } from '@modules/activity-register/service/consult.service';
import { MENU_ACTIONS_ITEM } from '@shared/const/menu-acciones.const';
import { SpecialnationaljuryService } from '@modules/activity-register/service/specialnationaljury.service';
import { FormFieldFileComponent } from '@shared/components/form-field-file/form-field-file.component';
import { FileService } from '@modules/activity-register/service/file.service';
import { AsistentTypeService } from '@modules/activity-format/service/asistent-type.service';
import { TargetAudienceService } from '@modules/activity-format/service/target-audience.service';

@Component({
  selector: 'app-form-activity-register',
  imports: [
    FormFieldAutoCompleteComponent,
    MatExpansionModule,
    FormFieldInputComponent,
    FormFieldDateComponent,
    FormFieldTextAreaComponent,
    FormFieldTimeComponent,
    MatButton,
    TablePaginateComponent,
    FormFieldFileComponent,
  ],
  templateUrl: './form-activity-register.html',
  styleUrl: './form-activity-register.scss',
})
export class FormActivityRegister implements OnInit, OnDestroy {
  private readonly asistentTypeService: AsistentTypeService = inject(AsistentTypeService);
  private readonly targetAudienceService: TargetAudienceService = inject(TargetAudienceService);
  private readonly electoralProcessService: ElectoralprocessService =
    inject(ElectoralprocessService);
  private readonly specialNationalJuryService: SpecialnationaljuryService = inject(
    SpecialnationaljuryService,
  );
  private readonly activityFormatService: ActivityFormatService = inject(ActivityFormatService);
  private readonly consultService: ConsultService = inject(ConsultService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly fileService: FileService = inject(FileService);

  @Input() public form: FormGroup<RegistroActividadForm> = registroActividadFormGroup;
  @Input() public errorMessagesForm: ErrorFields = errorMessagesRegistroActividadForm;
  @Input() public listDetailsParticipantsRegistro: RegistroActividadParticipanteResponseTable[] =
    [];
  @Input() public codigo: string = '';
  @Input() public isEdit: boolean = false;

  @Output() addParticipant = new EventEmitter<RegistroActividadParticipanteResponseTable>();
  @Output() removeParticipant = new EventEmitter<RegistroActividadParticipanteResponseTable>();

  public formDetailParticipantes: FormGroup<RegistroActividadParticipanteForm> =
    formatoParticipanteFormGroup;
  public errorMessagesFormDetailParticipantes: ErrorFields = errorMessagesRegistroParticipanteForm;
  public ultimoDniConsultado: string = '';

  protected headers: HeaderTable[] = [
    { id: 'indice', label: 'N°', datatype: 'string' },
    { id: 'dni', label: 'DNI', datatype: 'string' },
    { id: 'nombresCompletos', label: 'NOMBRES Y APELLIDOS', datatype: 'string' },
    { id: 'sexo', label: 'SEXO', datatype: 'string' },
    { id: 'edad', label: 'EDAD', datatype: 'string' },
    { id: 'isIndigena', label: 'INDÍGENA', datatype: 'checked' },
    { id: 'isAfroPeruano', label: 'AFRO-PERUANA', datatype: 'checked' },
    { id: 'isDiscapacitado', label: 'PERSONA CON DISCAPACIDAD', datatype: 'checked' },
    { id: 'organizacion', label: 'ORGANIZACION', datatype: 'string' },
    { id: 'cargo', label: 'CARGO', datatype: 'string' },
    { id: 'telefono', label: 'TELEFONO', datatype: 'string' },
    { id: 'correo', label: 'CORREO', datatype: 'string' },
    { id: 'opciones', label: 'OPCIONES', datatype: 'options-butons' },
  ];

  ngOnInit(): void {
    this.selectActivityFormat();
    this.selectElectoralProcess();
    this.selectSpecialNationalJury();
    this.selectAsistentType();
    this.selectTargetAudience()
  }

  ngOnDestroy(): void {
    this.form.reset();
  }

  // lista para filtar y llenar combos principales
  protected listActivityFormat: FormatoActividadResponse[] = [];

  // listas de los combos de formulario principal
  protected listElectoralProcess: AutoCompleteData[] = [];
  protected listjuradoNacionalEspecial: AutoCompleteData[] = [];
  protected listActivityType: AutoCompleteData[] = [];
  protected listTheme: AutoCompleteData[] = [];
  protected listAsistentType: AutoCompleteData[] = [];
  protected listTargetAudience: AutoCompleteData[] = [];

  // lista de los combos del formulario detalle
  protected listGender: AutoCompleteData[] = [
    {
      key: 'Masculino',
      value: 'Masculino',
    },
    {
      key: 'Femenino',
      value: 'Femenino',
    },
  ];
  protected listPoblation: AutoCompleteData[] = [
    {
      key: 'Indígena',
      value: 'Indígena',
    },
    {
      key: 'Afro-Peruana',
      value: 'Afro-Peruana',
    },
    {
      key: 'Personas con discapacidad',
      value: 'Personas con discapacidad',
    },
  ];

  protected isLoadingElectoralProcess: boolean = true;
  protected isLoadingjuradoNacionalEspecial: boolean = true;
  protected isLoadingActivityType: boolean = false;
  protected isLoadingTheme: boolean = false;
  protected isLoadingAsistentType: boolean = false;
  protected isLoadingTargetAudience: boolean = false;

  public selectActivityFormat() {
    this.listActivityFormat = [];
    this.isLoadingActivityType = true;
    this.activityFormatService
      .select()
      .pipe(
        finalize(() => {
          this.isLoadingActivityType = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: FormatoActividadResponse[]) => {
          this.listActivityFormat = response;
          this.selectActivityType();
        },
        error: () => {
          this.listActivityFormat = [];
        },
      });
  }

  protected selectActivityType() {
    this.isLoadingActivityType = true;
    const uniqueMap = new Map<number | string, AutoCompleteData>();
    for (const activityFormat of this.listActivityFormat) {
      if (!uniqueMap.has(activityFormat.codTipoActividad)) {
        uniqueMap.set(activityFormat.codTipoActividad, {
          key: activityFormat.codTipoActividad,
          value: activityFormat.descripcionTipoActividad,
        });
      }
    }
    this.listActivityType = Array.from(uniqueMap.values());
    this.isLoadingActivityType = false;
  }

  protected selectTeme(activityType: AutoCompleteData | null) {
    this.isLoadingTheme = true;
    if (!activityType) {
      this.form.get('tipoActividad')?.reset();
      this.form.get('tema')?.reset();
      this.isLoadingTheme = false;
      this.listTheme = [];
    }
    const selectedCodigoTipoActividad = activityType?.key;
    const uniqueMap = new Map<string, AutoCompleteData>();

    for (const activityFormat of this.listActivityFormat) {
      if (activityFormat.codTipoActividad !== selectedCodigoTipoActividad) {
        continue;
      }

      if (!uniqueMap.has(activityFormat.codigoFormatoActividad)) {
        uniqueMap.set(activityFormat.codigoFormatoActividad, {
          key: activityFormat.codigoFormatoActividad,
          value: activityFormat.tema,
          aux1: selectedCodigoTipoActividad,
        });
      }
    }

    this.listTheme = Array.from(uniqueMap.values());
    this.isLoadingTheme = false;
  }


  public selectTargetAudience() {
    this.listTargetAudience = [];
    this.isLoadingTargetAudience = true;
    this.targetAudienceService
      .select()
      .pipe(
        finalize(() => {
          this.isLoadingTargetAudience = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: AutoCompleteData[]) => {
          this.listTargetAudience = response;
        },
        error: () => {
          this.listTargetAudience = [];
        },
      });
  }

  public selectAsistentType() {
    this.listAsistentType = [];
    this.isLoadingAsistentType = true;
    this.asistentTypeService
      .select()
      .pipe(
        finalize(() => {
          this.isLoadingAsistentType = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: AutoCompleteData[]) => {
          this.listAsistentType = response;
        },
        error: () => {
          this.listAsistentType = [];
        },
      });
  }

  protected selectCodigo(tema: AutoCompleteData) {
    if (!tema) {
      this.codigo = '';
      return
    }
    const selectedTeme = tema?.key ?? '';
    const selectedCodigoTipoActividad = tema?.aux1 ?? '';
    if (!this.isEdit) {
      this.consultCodeRegistroActivity(
        selectedCodigoTipoActividad,
        selectedTeme
      );
    }
  }

  public consultCodeRegistroActivity(
    codigoTipoActividad: string,
    tema: string
  ) {
    this.activityFormatService
      .consultarCodigoSiguiente(
        codigoTipoActividad,
        tema
      )
      .pipe()
      .subscribe({
        next: (response: string) => {
          this.codigo = response;
          this.cdr.detectChanges();
        },
        error: () => {
          this.codigo = '';
        },
      });
  }

  public consultParticipante(numeroDni: string) {
    if (!numeroDni) return;
    if (numeroDni.length != 8) {
      return;
    }
    if (this.ultimoDniConsultado === numeroDni) return;

    this.ultimoDniConsultado = numeroDni;
    this.consultService
      .consultarParticipante(numeroDni)
      .pipe()
      .subscribe({
        next: (response: RegistroActividadParticipanteResponse) => {
          this.formDetailParticipantes.reset();
          const cleanData = Object.entries({
            dni: numeroDni,
            nombresCompletos: response.nombresCompletos,
            sexo: response.sexo && { key: response.sexo, value: response.sexo },
            cargo: response.cargo,
            telefono: response.telefono,
            correo: response.correo,
            edad: response.edad,
            organizacion: response.organizacion,
            poblacion: response.poblacion && { key: response.poblacion, value: response.poblacion },
          })
            .filter(([_, v]) => v !== null && v !== undefined && v !== '')
            .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

          this.formDetailParticipantes.patchValue(cleanData);
          this.cdr.detectChanges();
        },
        error: () => {
          this.codigo = '';
        },
      });
  }

  public selectElectoralProcess() {
    this.listElectoralProcess = [];
    this.isLoadingElectoralProcess = true;
    this.electoralProcessService
      .select()
      .pipe(
        finalize(() => {
          this.isLoadingElectoralProcess = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: AutoCompleteData[]) => {
          this.listElectoralProcess = response;
        },
        error: () => {
          this.listElectoralProcess = [];
        },
      });
  }

  public selectSpecialNationalJury() {
    this.listjuradoNacionalEspecial = [];
    this.isLoadingjuradoNacionalEspecial = true;
    this.specialNationalJuryService
      .select()
      .pipe(
        finalize(() => {
          this.isLoadingjuradoNacionalEspecial = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: AutoCompleteData[]) => {
          this.listjuradoNacionalEspecial = response;
        },
        error: () => {
          this.listjuradoNacionalEspecial = [];
        },
      });
  }

  public emitNewParticipant() {
    const rowDetailPartcipant =
      convertirRegistroActividadParticipanteFormToRegistroActividadParticipanteResponseTable(
        this.formDetailParticipantes,
        this.listDetailsParticipantsRegistro.length,
      );
    this.addParticipant.emit(rowDetailPartcipant);
    this.formDetailParticipantes.reset();
  }

  protected onOptionSelect($event: {
    menuItem: MenuItems;
    element: RegistroActividadParticipanteResponseTable;
  }) {
    if ($event.menuItem.id === MENU_ACTIONS_ITEM.DELETE.id) {
      this.removeParticipant.emit($event.element);
    }
  }

  // Métodos para manejar adjuntos
  public onAdjuntoListaAsistentesChange(file: File | File[] | null): void {
    const singleFile = Array.isArray(file) ? (file[0] ?? null) : file;
    this.form.get('adjuntoListaAsistentes')?.setValue(singleFile);
    this.cdr.detectChanges();
  }

  public onAdjuntoRegistroFotograficoChange(file: File | File[] | null): void {
    const singleFile = Array.isArray(file) ? (file[0] ?? null) : file;
    this.form.get('adjuntoRegistroFotografico')?.setValue(singleFile);
    this.cdr.detectChanges();
  }

  public descargarAdjunto(nombreArchivo: string | null | undefined): void {
    if (!nombreArchivo) return;
    this.fileService.downloadAndOpen(nombreArchivo, false);
  }
}
