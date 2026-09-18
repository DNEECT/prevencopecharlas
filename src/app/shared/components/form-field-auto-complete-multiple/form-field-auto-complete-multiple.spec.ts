import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFieldAutoCompleteMultiple } from './form-field-auto-complete-multiple';

describe('FormFieldAutoCompleteMultiple', () => {
  let component: FormFieldAutoCompleteMultiple;
  let fixture: ComponentFixture<FormFieldAutoCompleteMultiple>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldAutoCompleteMultiple],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldAutoCompleteMultiple);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
