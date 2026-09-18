import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListActivityFormat } from './list-activity-format';

describe('ListActivityFormat', () => {
  let component: ListActivityFormat;
  let fixture: ComponentFixture<ListActivityFormat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListActivityFormat],
    }).compileComponents();

    fixture = TestBed.createComponent(ListActivityFormat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
