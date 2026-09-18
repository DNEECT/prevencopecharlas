import { NgClass, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { ErrorField } from '@shared/interface/error-field.interface';
import { ValidatorsService } from '@shared/service/validators/validators.service';

@Component({
  selector: 'app-form-field-password',
  imports: [
    FormsModule,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    MatSuffix,
    ReactiveFormsModule,
    NgClass,
    MatError,
    NgIf,
  ],
  templateUrl: './form-field-password.component.html',
  styleUrl: './form-field-password.component.scss',
})
export class FormFieldPasswordComponent {
  private readonly validatorsService: ValidatorsService = inject(ValidatorsService);

  @Input() public control: FormControl = new FormControl();
  @Input() public messageErrors: ErrorField[] = [];
  @Input() public placeholder: string = '';
  @Input() public label: string = '';
  @Input() public controlName: string = '';
  @Input() public isEditable: boolean = true;

  public isVisible: boolean = false;

  public objectKeys(obj: ErrorField): string[] {
    return Object.keys(obj);
  }

  public getClass(): string {
    return this.validatorsService.getClass(this.control, this.isEditable);
  }
}
