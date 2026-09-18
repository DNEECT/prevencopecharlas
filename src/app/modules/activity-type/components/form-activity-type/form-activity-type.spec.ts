import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormActivityType } from './form-activity-type';

describe('FormActivityType', () => {
  let component: FormActivityType;
  let fixture: ComponentFixture<FormActivityType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormActivityType],
    }).compileComponents();

    fixture = TestBed.createComponent(FormActivityType);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
