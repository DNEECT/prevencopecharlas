import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormActivityFormat } from './form-activity-format';

describe('FormActivityFormat', () => {
  let component: FormActivityFormat;
  let fixture: ComponentFixture<FormActivityFormat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormActivityFormat],
    }).compileComponents();

    fixture = TestBed.createComponent(FormActivityFormat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
