import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DialogLoadingDto } from '@shared/interface/dialog.interface';
import { DialogLoadingComponent } from './dialog-loading.component';

describe('DialogAlertComponent', () => {
  let component: DialogLoadingComponent;
  let fixture: ComponentFixture<DialogLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogLoadingComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            tittle: 'Test Title',
            content: 'Test Content',
          } as DialogLoadingDto,
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
