import { TestBed } from '@angular/core/testing';

import { ActivityTypeService } from './activity-type.service';

describe('ActivityTypeService', () => {
  let service: ActivityTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
