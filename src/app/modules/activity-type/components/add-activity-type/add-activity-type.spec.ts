import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddActivityType } from './add-activity-type';

describe('AddActivityType', () => {
  let component: AddActivityType;
  let fixture: ComponentFixture<AddActivityType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddActivityType],
    }).compileComponents();

    fixture = TestBed.createComponent(AddActivityType);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
