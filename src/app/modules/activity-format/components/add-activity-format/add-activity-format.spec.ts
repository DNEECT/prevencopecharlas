import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddActivityFormat } from './add-activity-format';

describe('AddActivityFormat', () => {
  let component: AddActivityFormat;
  let fixture: ComponentFixture<AddActivityFormat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddActivityFormat],
    }).compileComponents();

    fixture = TestBed.createComponent(AddActivityFormat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
