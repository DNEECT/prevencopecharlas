import { TestBed } from '@angular/core/testing';

import { ActivityRegisterService } from './activity-register.service';

describe('ActivityRegisterService', () => {
  let service: ActivityRegisterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityRegisterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
