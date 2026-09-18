import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddActivityRegister } from './add-activity-register';

describe('AddActivityRegister', () => {
  let component: AddActivityRegister;
  let fixture: ComponentFixture<AddActivityRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddActivityRegister],
    }).compileComponents();

    fixture = TestBed.createComponent(AddActivityRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
