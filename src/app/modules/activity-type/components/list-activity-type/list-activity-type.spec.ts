import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListActivityType } from './list-activity-type';

describe('ListActivityType', () => {
  let component: ListActivityType;
  let fixture: ComponentFixture<ListActivityType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListActivityType],
    }).compileComponents();

    fixture = TestBed.createComponent(ListActivityType);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
