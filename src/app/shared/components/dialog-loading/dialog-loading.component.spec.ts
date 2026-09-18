import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DialogDataDto } from '../../models/dialogs.model';
import { DialogLoadingComponent } from './dialog-loading.component';

describe('DialogAlertComponent', () => {
  let component: DialogLoadingComponent;
  let fixture: ComponentFixture<DialogLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogLoadingComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            tittle: 'Test Title',
            content: 'Test Content',
          } as DialogDataDto,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogLoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
