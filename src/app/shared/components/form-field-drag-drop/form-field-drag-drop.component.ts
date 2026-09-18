import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { ValidatorsService } from '@shared/service/validators/validators.service';
import { ErrorField } from '@shared/interface/error-field.interface';

@Component({
  selector: 'app-form-field-drag-drop',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, MatIcon, MatButton, NgClass, MatIconButton],
  templateUrl: './form-field-drag-drop.component.html',
  styleUrls: ['./form-field-drag-drop.component.scss'],
})
export class FormFieldDragDropComponent implements OnInit {
  private readonly validatorsService: ValidatorsService = inject(ValidatorsService);

  @ViewChild('fileInput', { static: false }) fileInput?: ElementRef<HTMLInputElement>;

  @Input() public control: FormControl = new FormControl();
  @Input() public label: string = '';
  @Input() public placeholder: string = 'Arrastra y suelta tu archivo aquí';
  @Input() public accept: string = '.pdf,.png,.jpg,.jpeg';
  @Input() public multiple: boolean = false;
  @Input() public maxSizeMB: number = 20;
  @Input() public isEditable: boolean = true;
  @Input() public messageErrors: ErrorField[] = [];

  @Output() public valueChanged = new EventEmitter<File[] | File | null>();

  files: File[] = [];
  hover = false;

  ngOnInit(): void {
    // Suscripción opcional para reflejar cambios externos al control
    this.control.valueChanges.subscribe((v) => {
      // Mantener sincronía: si vienen archivos desde afuera, actualizarlos
      if (Array.isArray(v)) {
        this.files = v;
      } else if (v instanceof File) {
        this.files = [v];
      } else if (v == null) {
        this.files = [];
      }
    });
  }

  getClass(): string {
    return this.validatorsService.getClass(this.control, this.isEditable);
  }

  onFilesChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.handleFileList(input.files);
    // reset input para permitir volver a seleccionar el mismo archivo
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.hover = false;
    if (!event.dataTransfer) return;
    const dt = event.dataTransfer;
    if (dt.files && dt.files.length > 0) {
      this.handleFileList(dt.files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.isEditable) return;
    this.hover = true;
  }

  onDragLeave(): void {
    this.hover = false;
  }

  private handleFileList(fileList: FileList): void {
    const arr = Array.from(fileList);
    const filtered = arr.filter((f) => this.isAccepted(f) && this.isUnderSize(f));
    if (filtered.length === 0) return;
    if (this.multiple) {
      this.files = [...this.files, ...filtered];
      this.control.setValue(this.files);
      this.valueChanged.emit(this.files);
    } else {
      const first = filtered[0];
      this.files = [first];
      this.control.setValue(first);
      this.valueChanged.emit(first);
    }
  }

  private isAccepted(file: File): boolean {
    if (!this.accept) return true;
    const accepts = this.accept.split(',').map((s) => s.trim().toLowerCase());
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return accepts.includes(ext) || accepts.includes(file.type.toLowerCase());
  }

  private isUnderSize(file: File): boolean {
    const mb = file.size / (1024 * 1024);
    return mb <= this.maxSizeMB;
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
    if (this.multiple) {
      this.control.setValue(this.files.length ? this.files : null);
      this.valueChanged.emit(this.files.length ? this.files : null);
    } else {
      this.control.setValue(null);
      this.valueChanged.emit(null);
    }
  }

  clearAll(): void {
    this.files = [];
    this.control.setValue(null);
    this.valueChanged.emit(null);
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  openFileDialog(): void {
    if (!this.fileInput) return;
    this.fileInput.nativeElement.click();
  }

  downloadFile(file: File): void {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(3) + ' MB';
  }
}
