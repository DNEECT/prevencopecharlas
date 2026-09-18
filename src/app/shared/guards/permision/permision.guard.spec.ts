import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { permisionGuard } from './permision.guard';

describe('permisionGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => permisionGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
