import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  let service: SnackbarService;
  let snackBar: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [SnackbarService],
    });
    service = TestBed.inject(SnackbarService);
    snackBar = TestBed.inject(MatSnackBar);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open error snack bar empty data', () => {
    const spy = spyOn(snackBar, 'openFromComponent').and.callThrough();
    service.openErrorSnackBar('Error message');
    expect(spy).toHaveBeenCalled();
  });

  it('should open success snack bar empty data', () => {
    const spy = spyOn(snackBar, 'openFromComponent').and.callThrough();
    service.openSuccessSnackBar('Success message');
    expect(spy).toHaveBeenCalled();
  });

  it('should open info snack bar empty data', () => {
    const spy = spyOn(snackBar, 'openFromComponent').and.callThrough();
    service.openWarningSnackBar('Info message');
    expect(spy).toHaveBeenCalled();
  });
});
