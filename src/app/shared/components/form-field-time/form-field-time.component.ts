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
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { ErrorField } from '@shared/interface/error-field.interface';
import { ValidatorsService } from '@shared/service/validators/validators.service';

@Component({
  selector: 'app-form-field-time',
  imports: [
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    MatIcon,
    MatIconButton,
    NgClass,
    NgIf,
    MatFormFieldModule,
    FormsModule,
    MatInput,
    MatInputModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './form-field-time.component.html',
  styleUrl: './form-field-time.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldTimeComponent implements OnInit {
  private readonly validatorsService: ValidatorsService = inject(ValidatorsService);

  @Input() public control: FormControl = new FormControl();
  @Input() public messageErrors: ErrorField[] = [];
  @Input() public placeholder: string = 'Hora';
  @Input() public label: string = 'Hora';
  @Input() public isEditable: boolean = true;
  @Input() public controlName: string = 'hora';
  @Input() public stepMinutes: number = 15; // paso por defecto

  @Output() changeCallback: EventEmitter<void> = new EventEmitter();

  public showDeleteIcon: boolean = false;
  public times: { value: string; label: string }[] = [];
  public displayValue: string = '';

  ngOnInit(): void {
    this.control.valueChanges.subscribe((response) => {
      this.showDeleteIcon = !!response;
      this.displayValue = this.toDisplay(response);
    });

    this.generateTimes();
  }

  private generateTimes() {
    const step = Math.max(1, Math.floor(this.stepMinutes));
    const list: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += step) {
        const hh = `0${h}`.slice(-2);
        const mm = `0${m}`.slice(-2);
        const value = `${hh}:${mm}`;
        list.push({ value, label: this.format12(value) });
      }
    }
    this.times = list;
  }

  private format12(value: string): string {
    if (!value) return '';
    const [hhStr, mm] = value.split(':');
    let hh = parseInt(hhStr, 10);
    const suffix = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 === 0 ? 12 : hh % 12;
    return `${hh}:${mm} ${suffix}`;
  }

  private toDisplay(value: any): string {
    if (!value) return '';
    // if already in HH:mm string
    if (typeof value === 'string' && value.match(/^\d{2}:\d{2}$/)) {
      return this.format12(value as string);
    }
    // if Date-like
    if (value instanceof Date) {
      const hh = `0${value.getHours()}`.slice(-2);
      const mm = `0${value.getMinutes()}`.slice(-2);
      return this.format12(`${hh}:${mm}`);
    }
    return String(value);
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
