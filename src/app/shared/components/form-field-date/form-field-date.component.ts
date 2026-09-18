import { NgClass, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';
import { MatDatepickerModule, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import moment from 'moment';
import { ErrorField } from '@shared/interface/error-field.interface';
import { ValidatorsService } from '@shared/service/validators/validators.service';

export const CUSTOM_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-form-field-date',
  imports: [
    MatFormField,
    MatLabel,
    MatDatepickerToggle,
    ReactiveFormsModule,
    MatIcon,
    MatIconButton,
    NgClass,
    NgIf,
    MatFormFieldModule,
    MatDatepickerModule,
    FormsModule,
    MatInput,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './form-field-date.component.html',
  styleUrl: './form-field-date.component.scss',
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } }, // 📌 Deshabilita UTC
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldDateComponent implements OnInit {
  private readonly validatorsService: ValidatorsService = inject(ValidatorsService);

  @Input() public control: FormControl = new FormControl();
  @Input() public messageErrors: ErrorField[] = [];
  @Input() public placeholder: string = 'Fecha';
  @Input() public label: string = 'Fechas';
  @Input() public isEditable: boolean = true;
  @Input() public controlName: string = 'fecha';
  @Input() public minDate: Date | null = null;
  @Input() public maxDate: Date | null = null;

  @Output() changeCallback: EventEmitter<void> = new EventEmitter();

  public showDeleteIcon: boolean = false;

  ngOnInit(): void {
    this.control.valueChanges.subscribe((response) => {
      this.showDeleteIcon = !!response;
      if (response) {
        const formattedDate = this.convertToYYYYMMDD(response);
        if (formattedDate !== this.control.value) {
          this.control.setValue(formattedDate, { emitEvent: false });
        }
      }
    });
  }

  private convertToYYYYMMDD(date: any): string {
    if (!date) {
      return '';
    }

    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }

    if (typeof date === 'string') {
      if (date.includes('T')) {
        return date.split('T')[0];
      }

      return date;
    }

    if (date instanceof Date) {
      return this.getLocalYYYYMMDD(date);
    }

    return date;
  }

  private getLocalYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const day = `0${date.getDate()}`.slice(-2);

    return `${year}-${month}-${day}`;
  }

  public onChange() {
    if (this.control.value) {
      this.changeCallback.emit();
    }
  }

  public objectKeys(obj: ErrorField): string[] {
    return Object.keys(obj);
  }

  public clear() {
    this.control.reset();
    this.changeCallback.emit();
  }

  public getClass(): string {
    return this.validatorsService.getClass(this.control, this.isEditable);
  }
}
