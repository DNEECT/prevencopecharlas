// typescript
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { ValidatorsService } from '@shared/service/validators/validators.service';
import { ErrorField } from '@shared/interface/error-field.interface';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-form-field-file',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatError,
    MatIcon,
    NgIf,
    NgClass,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatInput,
    NgFor,
  ],
  templateUrl: './form-field-file.component.html',
  styleUrls: ['./form-field-file.component.scss'],
})
export class FormFieldFileComponent implements OnInit {
  private readonly validatorsService: ValidatorsService = inject(ValidatorsService);

  @ViewChild('fileInput', { static: false }) fileInput?: ElementRef<HTMLInputElement>;

  @Input() public control: FormControl = new FormControl();
  @Input() public messageErrors: ErrorField[] = [];
  @Input() public placeholder: string = '';
  @Input() public label: string = '';
  @Input() public isEditable: boolean = true;
  @Input() public showClearButton: boolean = false;
  @Input() public controlName: string = '';
  @Input() public accept: string = '.png,.jpg,.jpeg';
  @Input() public multiple: boolean = false;

  @Output() public valueChanged = new EventEmitter<File[] | File | null>();
  @Output() public downloadExisting = new EventEmitter<string>();

  public selectedFiles: File[] = [];
  public existingFileUrl: string | null = null;
  private isInternalUpdate = false;

  public get selectedFileName(): string {
    // Si hay archivos File seleccionados, mostrar sus nombres
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      if (this.selectedFiles.length === 1) return this.selectedFiles[0].name;
      return `${this.selectedFiles.length} archivos seleccionados`;
    }
    // Si hay una URL existente, extraer el nombre del archivo
    if (this.existingFileUrl) {
      return this.existingFileUrl.split('/').pop() || this.existingFileUrl;
    }
    return '';
  }

  public get hasFile(): boolean {
    return this.selectedFiles.length > 0 || !!this.existingFileUrl;
  }

  public objectKeys(obj: ErrorField): string[] {
    return Object.keys(obj);
  }

  public getClass(): string {
    return this.validatorsService.getClass(this.control, this.isEditable);
  }

  public subscribeToFormControl(): void {
    // Inicializar con el valor actual del control
    this.syncValueFromControl(this.control.value);

    this.control.valueChanges.subscribe((value) => {
      // Ignorar si es una actualización interna para evitar ciclos
      if (this.isInternalUpdate) {
        this.isInternalUpdate = false;
        return;
      }
      this.syncValueFromControl(value);
    });
  }

  private syncValueFromControl(value: any): void {
    if (Array.isArray(value)) {
      this.selectedFiles = value.filter((v) => v instanceof File);
      this.existingFileUrl = null;
    } else if (value instanceof File) {
      this.selectedFiles = [value];
      this.existingFileUrl = null;
    } else if (typeof value === 'string' && value.length > 0) {
      // Es una URL existente
      this.selectedFiles = [];
      this.existingFileUrl = value;
    } else {
      this.selectedFiles = [];
      this.existingFileUrl = null;
    }
  }

  public clearInput(): void {
    this.selectedFiles = [];
    this.existingFileUrl = null;
    // actualizar control y emitir
    this.isInternalUpdate = true;
    this.control.setValue(null);
    this.valueChanged.emit(null);
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  ngOnInit(): void {
    this.subscribeToFormControl();
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    if (files.length === 0) return;

    // Limpiar URL existente ya que se está seleccionando un nuevo archivo
    this.existingFileUrl = null;

    if (this.multiple) {
      this.selectedFiles = [...this.selectedFiles, ...files];
      // actualizar control con arreglo de files
      this.isInternalUpdate = true;
      this.control.setValue(this.selectedFiles);
      this.valueChanged.emit(this.selectedFiles);
    } else {
      this.selectedFiles = [files[0]];
      this.isInternalUpdate = true;
      this.control.setValue(files[0]);
      this.valueChanged.emit(files[0]);
    }

    // permitir volver a seleccionar el mismo archivo
    input.value = '';
  }

  public removeFile(index: number): void {
    if (index < 0 || index >= this.selectedFiles.length) return;
    this.selectedFiles.splice(index, 1);
    this.isInternalUpdate = true;
    if (this.multiple) {
      this.control.setValue(this.selectedFiles.length ? this.selectedFiles : null);
      this.valueChanged.emit(this.selectedFiles.length ? this.selectedFiles : null);
    } else {
      this.control.setValue(null);
      this.valueChanged.emit(null);
    }
  }

  public downloadFile(file: File): void {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  public downloadExistingFile(): void {
    if (this.existingFileUrl) {
      this.downloadExisting.emit(this.existingFileUrl);
    }
  }

  public openFileSelector(): void {
    if (!this.isEditable) return;
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.click();
    }
  }

  public formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(3) + ' MB';
  }
}
