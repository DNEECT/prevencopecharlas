import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldTimeComponent } from './form-field-time.component';

describe('FormFieldTimeComponent', () => {
  let component: FormFieldTimeComponent;
  let fixture: ComponentFixture<FormFieldTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldTimeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
