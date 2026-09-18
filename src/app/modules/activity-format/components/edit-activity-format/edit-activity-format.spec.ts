import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditActivityFormat } from './edit-activity-format';

describe('EditActivityFormat', () => {
  let component: EditActivityFormat;
  let fixture: ComponentFixture<EditActivityFormat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditActivityFormat],
    }).compileComponents();

    fixture = TestBed.createComponent(EditActivityFormat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
