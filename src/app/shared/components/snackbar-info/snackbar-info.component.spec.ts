import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { SnackbarInfoComponent } from './snackbar-info.component';
import { Snackbar } from '../../interface/snackbar.interface';

describe('SnackbarInfoComponent', () => {
  let component: SnackbarInfoComponent;
  let fixture: ComponentFixture<SnackbarInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SnackbarInfoComponent],
      providers: [
        {
          provide: MAT_SNACK_BAR_DATA,
          useValue: { message: 'test_message', icon: 'info_outline' } as Snackbar,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnackbarInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
