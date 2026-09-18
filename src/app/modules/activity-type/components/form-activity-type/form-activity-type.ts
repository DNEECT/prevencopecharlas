import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormFieldInputComponent } from '@shared/components/form-field-input/form-field-input.component';
import { FormFieldTextAreaComponent } from '@shared/components/form-field-text-area/form-field-text-area.component';
import { FormGroup } from '@angular/forms';
import {
  errorMessagesTipoActividadForm,
  TipoActividadForm,
  tipoActividadFormGroup,
} from '@modules/activity-type/interface/activity-type';
import { ErrorFields } from '@shared/interface/error-field.interface';

@Component({
  selector: 'app-form-activity-type',
  imports: [FormFieldInputComponent, FormFieldTextAreaComponent],
  templateUrl: './form-activity-type.html',
  styleUrl: './form-activity-type.scss',
})
export class FormActivityType implements OnInit, OnDestroy {
  @Input() public form: FormGroup<TipoActividadForm> = tipoActividadFormGroup;
  @Input() public errorMessagesForm: ErrorFields = errorMessagesTipoActividadForm;

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.form.reset();
  }
}
