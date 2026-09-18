import { TestBed } from '@angular/core/testing';

import { ActivityFormatRepository } from './activity-format.repository';

describe('ActivityFormatRepository', () => {
  let service: ActivityFormatRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityFormatRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
