import { TestBed } from '@angular/core/testing';

import { ActivityFormatResolver } from './activity-format.resolver';

describe('ActivityFormatResolver', () => {
  let service: ActivityFormatResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityFormatResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
