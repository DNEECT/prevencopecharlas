import { NgClass, NgIf } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ErrorField } from '@shared/interface/error-field.interface';
import { ValidatorsService } from '@shared/service/validators/validators.service';

@Component({
  selector: 'app-form-field-input',
  imports: [
    FormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    MatError,
    NgIf,
    NgClass,
    MatIcon,
    MatSuffix,
  ],
  templateUrl: './form-field-input.component.html',
  styleUrl: './form-field-input.component.scss',
})
export class FormFieldInputComponent implements OnInit {
  private readonly validatorsService: ValidatorsService = inject(ValidatorsService);

  @Input() public inputType: string = 'text';
  @Input() public control: FormControl = new FormControl();
  @Input() public messageErrors: ErrorField[] = [];
  @Input() public placeholder: string = '';
  @Input() public label: string = '';
  @Input() public isEditable: boolean = true;
  @Input() public showClearButton: boolean = false;
  @Input() public controlName: string = '';
  @Input() public maxLength?: number;
  @Output() public valueChanged = new EventEmitter<string>();
  @Output() public deleteData = new EventEmitter<string>();

  public objectKeys(obj: ErrorField): string[] {
    return Object.keys(obj);
  }

  public getClass(): string {
    return this.validatorsService.getClass(this.control, this.isEditable);
  }

  public subscribeToFormControl() {
    this.control.valueChanges
      .pipe(distinctUntilChanged(), debounceTime(1000))
      .subscribe((value) => {
        this.valueChanged.emit(value);
      });
  }

  public clearInput(): void {
    this.control.setValue(null);
    this.control.markAsTouched();
    this.deleteData.emit(this.control.value);
  }

  ngOnInit(): void {
    this.subscribeToFormControl();
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;

    // caso especial por compatibilidad con la prop anterior
    if (this.inputType === 'digitos') {
      const soloNumeros = input.value.replace(/[^0-9]/g, '');
      if (input.value !== soloNumeros) {
        input.value = soloNumeros;
        this.control.setValue(soloNumeros);
      }
      this.enforceMaxLength(input);
      return;
    }

    if (this.inputType === 'letters') {
      const soloLetras = input.value.replace(/[^A-Za-z]/g, '');
      if (input.value !== soloLetras) {
        input.value = soloLetras;
        this.control.setValue(soloLetras);
      }
      this.enforceMaxLength(input);
      return;
    }

    if (this.inputType === 'alphanumeric') {
      const limpio = input.value.replace(/[^A-Za-z0-9]/g, '');
      if (input.value !== limpio) {
        input.value = limpio;
        this.control.setValue(limpio);
      }
      this.enforceMaxLength(input);
      return;
    }
    this.enforceMaxLength(input);
  }

  private enforceMaxLength(input: HTMLInputElement): void {
    if (this.maxLength == null) return;
    if (input.value.length > this.maxLength) {
      const trimmed = input.value.slice(0, this.maxLength);
      const priorSelectionStart = input.selectionStart ?? trimmed.length;
      input.value = trimmed;
      this.control.setValue(trimmed);
      const pos = Math.min(priorSelectionStart, this.maxLength);
      try {
        input.setSelectionRange(pos, pos);
      } catch {
        alert('Error al establecer la posición del cursor navegador no soporta');
      }
    }
  }
}
