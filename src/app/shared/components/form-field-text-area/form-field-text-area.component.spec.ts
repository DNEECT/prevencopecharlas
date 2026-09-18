import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFieldTextAreaComponent } from './form-field-text-area.component';

describe('FormFieldTextAreaComponent', () => {
  let component: FormFieldTextAreaComponent;
  let fixture: ComponentFixture<FormFieldTextAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldTextAreaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldTextAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
