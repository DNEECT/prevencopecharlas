import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditActivityRegister } from './edit-activity-register';

describe('EditActivityRegister', () => {
  let component: EditActivityRegister;
  let fixture: ComponentFixture<EditActivityRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditActivityRegister],
    }).compileComponents();

    fixture = TestBed.createComponent(EditActivityRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
