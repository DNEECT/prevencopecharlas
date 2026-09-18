import { CommonModule } from '@angular/common';
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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { distinctUntilChanged } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { ValidatorsService } from '@shared/service/validators/validators.service';
import { ErrorField } from '@shared/interface/error-field.interface';

@Component({
  selector: 'app-form-field-auto-complete',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinner,
  ],
  templateUrl: './form-field-auto-complete.component.html',
  styleUrls: ['./form-field-auto-complete.component.scss'],
})
export class FormFieldAutoCompleteComponent<T = any> implements OnInit {
  private readonly validatorsService = inject(ValidatorsService);

  @Input() placeholder: string = '';
  @Input() label: string = '';
  @Input() control: FormControl = new FormControl();
  @Input() messageErrors: ErrorField[] = [];
  @Input() options: T[] = [];
  @Input() keyField: keyof T = 'id' as keyof T; // campo que actúa como identificador
  @Input() valueField: keyof T = 'value' as keyof T; // campo visible al usuario
  @Input() isLoading: boolean = false;
  @Input() isEditable: boolean = true;
  @Input() controlName: string = '';
  @Output() valueChanged = new EventEmitter<T>();

  @ViewChild('input', { static: true }) input!: ElementRef<HTMLInputElement>;

  public filteredOptions: T[] = [];
  public panelOpen: boolean = false;

  ngOnInit(): void {
    this.subscribeToFormControl();
    this.filter();
  }

  public filter(): void {
    const filterValue = this.input?.nativeElement.value?.toLowerCase() || '';
    this.filteredOptions = this.options.filter((option) => {
      const value = String(option[this.valueField] ?? '').toLowerCase();
      return value.includes(filterValue);
    });
  }

  public displayFn(option: T): string {
    return option ? String(option[this.valueField]) : '';
  }

  public subscribeToFormControl(): void {
    this.control.valueChanges.pipe(distinctUntilChanged()).subscribe((value) => {
      this.valueChanged.emit(value);
    });
  }

  public clear(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.input) this.input.nativeElement.value = '';
    this.control.setValue(null);
    this.filter();
  }

  public onToggleClick(
    event: MouseEvent,
    input: HTMLInputElement,
    trigger: MatAutocompleteTrigger,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    try {
      if (trigger.panelOpen) {
        trigger.closePanel();
      } else {
        input.focus();
        trigger.openPanel();
      }
    } catch {
      input.focus();
    }
  }

  public onOptionSelected(value: T): void {
    this.control.setValue(value);
    this.filter();
  }

  public objectKeys(obj: ErrorField): string[] {
    return Object.keys(obj);
  }

  public getClass(): string {
    return this.validatorsService.getClass(this.control, this.isEditable);
  }
}
