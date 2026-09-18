import { ChangeDetectorRef, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormFieldInputComponent } from '@shared/components/form-field-input/form-field-input.component';
import { FormFieldTextAreaComponent } from '@shared/components/form-field-text-area/form-field-text-area.component';
import { FormFieldAutoCompleteComponent } from '@shared/components/form-field-auto-complete/form-field-auto-complete.component';
import { FormGroup } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import {
  errorMessagesFormatoActividadForm,
  FormatoActividadForm,
  formatoActividadFormGroup,
} from '@modules/activity-format/interface/activity-format';
import { finalize } from 'rxjs';
import { AsistentTypeService } from '@modules/activity-format/service/asistent-type.service';
import { TargetAudienceService } from '@modules/activity-format/service/target-audience.service';
import { ActivityTypeService } from '@modules/activity-type/service/activity-type.service';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';

@Component({
  selector: 'app-form-activity-format',
  imports: [FormFieldTextAreaComponent, FormFieldAutoCompleteComponent, FormFieldInputComponent],
  templateUrl: './form-activity-format.html',
  styleUrl: './form-activity-format.scss',
})
export class FormActivityFormat implements OnInit, OnDestroy {
  private readonly activityTypeService: ActivityTypeService = inject(ActivityTypeService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  @Input() public form: FormGroup<FormatoActividadForm> = formatoActividadFormGroup;
  @Input() public errorMessagesForm: ErrorFields = errorMessagesFormatoActividadForm;

  ngOnInit(): void {
    this.selectActivityType();
  }

  ngOnDestroy(): void {
    this.form.reset();
  }

  protected listActivityType: AutoCompleteData[] = [];

  protected isLoadingActivityType: boolean = true;

  public selectActivityType() {
    this.listActivityType = [];
    this.isLoadingActivityType = true;
    this.activityTypeService
      .select()
      .pipe(
        finalize(() => {
          this.isLoadingActivityType = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: AutoCompleteData[]) => {
          this.listActivityType = response;
        },
        error: () => {
          this.listActivityType = [];
        },
      });
  }

}
