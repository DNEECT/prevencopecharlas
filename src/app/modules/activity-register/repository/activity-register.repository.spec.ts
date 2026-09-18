import { TestBed } from '@angular/core/testing';

import { ActivityRegisterRepository } from './activity-register.repository';

describe('ActivityRegisterRepository', () => {
  let service: ActivityRegisterRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityRegisterRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
