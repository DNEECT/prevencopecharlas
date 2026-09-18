import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class ValidatorsService {
  public matchingPasswordsValidator(controlName: string, matchingControlName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control instanceof FormGroup) {
        const formGroup = control;
        const passwordControl = formGroup.get(controlName);
        const confirmPasswordControl = formGroup.get(matchingControlName);

        if (!passwordControl || !confirmPasswordControl) {
          return { controlNotFound: true };
        }

        if (passwordControl.value !== confirmPasswordControl.value) {
          confirmPasswordControl.setErrors({ mismatch: true });

          return { mismatch: true };
        }
        confirmPasswordControl.setErrors(null);

        return null;
      }

      return null;
    };
  }

  public getClass(control: FormControl, isEditable: boolean): string {
    let className = '';
    if (this.isRequired(control)) {
      className += 'required ';
    }
    if (!isEditable) {
      className += 'disabled';
    }
    if (control.value !== null && control.value !== undefined && control.value !== '') {
      className += 'required';
    }

    return className;
  }

  private isRequired(control: FormControl): boolean {
    if (control.validator) {
      const validator = control.validator({} as any);

      return !!(validator && validator['required']);
    }

    return false;
  }
}
