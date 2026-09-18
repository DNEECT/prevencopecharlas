import { TestBed } from '@angular/core/testing';

import { ActivityRegisterResolver } from './activity-register.resolver';

describe('ActivityRegisterResolver', () => {
  let service: ActivityRegisterResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityRegisterResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
