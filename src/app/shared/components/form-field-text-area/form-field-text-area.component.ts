import { NgClass, NgIf } from '@angular/common';
import { Component, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { ErrorField } from '@shared/interface/error-field.interface';
import { ValidatorsService } from '@shared/service/validators/validators.service';

@Component({
  selector: 'app-form-field-text-area',
  imports: [
    FormsModule,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    NgIf,
    ReactiveFormsModule,
    NgClass,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './form-field-text-area.component.html',
  styleUrl: './form-field-text-area.component.scss',
})
export class FormFieldTextAreaComponent implements OnInit {
  private readonly validatorsService: ValidatorsService = inject(ValidatorsService);

  @Input() public inputType: string = 'text';
  @Input() public control: FormControl = new FormControl();
  @Input() public messageErrors: ErrorField[] = [];
  @Input() public placeholder: string = '';
  @Input() public label: string = '';
  @Input() public isEditable: boolean = true;
  @Input() public controlName: string = '';

  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  public objectKeys(obj: ErrorField): string[] {
    return Object.keys(obj);
  }

  public getClass(): string {
    return this.validatorsService.getClass(this.control, this.isEditable);
  }

  ngOnInit() {
    this.subscribeToFormControl();
  }

  public subscribeToFormControl() {
    this.control.valueChanges.subscribe(() => {
      this.resizeTextArea();
    });
  }

  public resizeTextArea() {
    const textarea = this.textarea.nativeElement;
    textarea.style.height = 'auto';
    if (!textarea.value) {
      textarea.style.height = 'auto';
    } else {
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }
}
