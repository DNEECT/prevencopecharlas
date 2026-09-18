import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFieldAutoCompleteComponent } from './form-field-auto-complete.component';

describe('FormFieldAutoCompleteComponent', () => {
  let component: FormFieldAutoCompleteComponent;
  let fixture: ComponentFixture<FormFieldAutoCompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldAutoCompleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldAutoCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
