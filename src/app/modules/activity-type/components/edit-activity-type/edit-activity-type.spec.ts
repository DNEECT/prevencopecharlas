import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditActivityType } from './edit-activity-type';

describe('EditActivityType', () => {
  let component: EditActivityType;
  let fixture: ComponentFixture<EditActivityType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditActivityType],
    }).compileComponents();

    fixture = TestBed.createComponent(EditActivityType);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
