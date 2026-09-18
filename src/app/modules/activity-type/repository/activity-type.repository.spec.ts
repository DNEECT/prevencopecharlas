import { TestBed } from '@angular/core/testing';

import { ActivityTypeRepository } from './activity-type.repository';

describe('ActivityTypeRepository', () => {
  let service: ActivityTypeRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityTypeRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
