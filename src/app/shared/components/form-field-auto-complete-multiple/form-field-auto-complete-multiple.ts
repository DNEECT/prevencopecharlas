import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { NgClass, NgIf } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIconButton } from '@angular/material/button';
import { ValidatorsService } from '@shared/service/validators/validators.service';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { ErrorField } from '@shared/interface/error-field.interface';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-form-field-auto-complete-multiple',
  imports: [
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    MatAutocomplete,
    MatOption,
    ReactiveFormsModule,
    NgClass,
    MatAutocompleteTrigger,
    MatInput,
    MatProgressSpinner,
    MatIconButton,
    NgIf,
  ],
  templateUrl: './form-field-auto-complete-multiple.html',
  styleUrl: './form-field-auto-complete-multiple.scss',
})
export class FormFieldAutoCompleteMultiple implements OnInit {
  private readonly validatorsService: ValidatorsService = inject(ValidatorsService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  @Input() public placeholder: string = '';
  @Input() public label: string = '';
  @Input() public control: FormControl = new FormControl<AutoCompleteData[]>([], {});
  @Input() public messageErrors: ErrorField[] = [];
  @Input() public options: AutoCompleteData[] = [];
  @Input() public isLoading: boolean = false;
  @Input() public controlName: string = '';
  @Input() public isEditable: boolean = true;
  @Output() public valueChanged = new EventEmitter<AutoCompleteData>();

  @ViewChild('input', { static: true }) public input: ElementRef<HTMLInputElement> =
    {} as ElementRef<HTMLInputElement>;

  public addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  public selected: AutoCompleteData[] = [];
  public filteredOptions: AutoCompleteData[] = [];

  public panelOpen: boolean = false;
  public formControl: FormControl = new FormControl();

  public add(item: AutoCompleteData): void {
    if (item) {
      this.selected = [...this.selected, item];
      this.control.setValue(this.selected);
    }
    this.input.nativeElement.value = '';
    this.filter();
    this.cdr.detectChanges();
  }

  public remove(item: AutoCompleteData): void {
    const index = this.selected.indexOf(item);
    if (index >= 0) {
      this.selected.splice(index, 1);
      this.control.setValue(this.selected);
    }
  }

  ngOnInit() {
    if (this.control.validator) {
      this.formControl.addValidators(this.control.validator);
    }
    if (this.control.asyncValidator) {
      this.formControl.addAsyncValidators(this.control.asyncValidator);
    }
    this.formControl.setValue(this.control.value);
    this.selected = [...this.control.value];
    this.subscribeToFormControl();
    this.filter();
  }

  public filter(): void {
    const filterValue = this.input.nativeElement.value.toLowerCase();
    this.filteredOptions = this.options?.filter(
      (option) =>
        option.value.trim().toLowerCase().includes(filterValue) &&
        !this.selected?.some((selectedItem) => selectedItem.key === option.key),
    );
  }

  public displayFn(option: AutoCompleteData): string {
    return option?.value ?? '';
  }

  public subscribeToFormControl() {
    this.control.valueChanges.pipe(distinctUntilChanged()).subscribe((value) => {
      console.log(value);
      if (value) {
        this.valueChanged.emit(value);
        this.selected = [...value];
      } else {
        this.selected = [];
      }
      this.filter();
    });
  }

  public clear(): void {
    this.selected = [];
    this.filteredOptions = this.options;
    this.input.nativeElement.value = '';
    this.control.setValue([]);
    this.formControl.setValue([]);
    this.filter();
  }

  public objectKeys(obj: ErrorField): string[] {
    return Object.keys(obj);
  }

  public getClass(): string {
    return this.validatorsService.getClass(this.control, this.isEditable);
  }

  public isDataSelected(): boolean {
    return this.selected?.length > 0;
  }

  public truncateText(text: string, maxLength: number): string {
    if (text && text.length > maxLength) {
      return `${text.substring(0, maxLength)}...`;
    }

    return text;
  }
}
