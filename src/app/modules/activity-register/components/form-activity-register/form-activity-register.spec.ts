import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormActivityRegister } from './form-activity-register';

describe('FormActivityRegister', () => {
  let component: FormActivityRegister;
  let fixture: ComponentFixture<FormActivityRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormActivityRegister],
    }).compileComponents();

    fixture = TestBed.createComponent(FormActivityRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
