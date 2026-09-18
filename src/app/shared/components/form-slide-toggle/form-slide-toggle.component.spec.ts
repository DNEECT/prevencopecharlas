import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSlideToggleComponent } from './form-slide-toggle.component';

describe('FormSlideToggleComponent', () => {
  let component: FormSlideToggleComponent;
  let fixture: ComponentFixture<FormSlideToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormSlideToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormSlideToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
