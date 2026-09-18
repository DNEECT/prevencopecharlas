import { TestBed } from '@angular/core/testing';

import { ActivityTypeResolver } from './activity-type.resolver';

describe('ActivityTypeResolver', () => {
  let service: ActivityTypeResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityTypeResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
