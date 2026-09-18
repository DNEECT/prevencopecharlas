import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFieldDragDropComponent } from './form-field-drag-drop.component';

describe('FormFieldDragDropComponent', () => {
  let component: FormFieldDragDropComponent;
  let fixture: ComponentFixture<FormFieldDragDropComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldDragDropComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldDragDropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
