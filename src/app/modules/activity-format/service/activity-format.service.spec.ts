import { TestBed } from '@angular/core/testing';

import { ActivityFormatService } from './activity-format.service';

describe('ActivityFormatService', () => {
  let service: ActivityFormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityFormatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
