import { ChangeDetectorRef, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormFieldInputComponent } from '@shared/components/form-field-input/form-field-input.component';
import { FormGroup } from '@angular/forms';
import { ErrorFields } from '@shared/interface/error-field.interface';
import { AutoCompleteData } from '@shared/interface/auto-complete-interface';
import { finalize } from 'rxjs';
import { errorMessagesUsuarioForm, UsuarioForm, usuarioFormGroup } from '../../interface/user';
import { RoleService } from '../../service/role.service';
import { FormFieldAutoCompleteMultiple } from '@shared/components/form-field-auto-complete-multiple/form-field-auto-complete-multiple';
import { FormFieldDateComponent } from '@shared/components/form-field-date/form-field-date.component';

@Component({
  selector: 'app-form-user',
  imports: [FormFieldInputComponent, FormFieldAutoCompleteMultiple, FormFieldDateComponent],
  templateUrl: './form-user.html',
  styleUrl: './form-user.scss',
})
export class FormUser implements OnInit, OnDestroy {
  private readonly roleService: RoleService = inject(RoleService);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  @Input() public form: FormGroup<UsuarioForm> = usuarioFormGroup;
  @Input() public errorMessagesForm: ErrorFields = errorMessagesUsuarioForm;

  ngOnInit(): void {
    this.selectRole();
  }

  ngOnDestroy(): void {
    this.form.reset();
  }

  protected listRole: AutoCompleteData[] = [];
  protected isLoadingRole: boolean = true;

  public selectRole() {
    this.listRole = [];
    this.isLoadingRole = true;
    this.roleService
      .select()
      .pipe(
        finalize(() => {
          this.isLoadingRole = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: AutoCompleteData[]) => {
          this.listRole = response;
        },
        error: () => {
          this.listRole = [];
        },
      });
  }
}
