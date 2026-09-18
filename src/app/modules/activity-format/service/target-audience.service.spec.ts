import { TestBed } from '@angular/core/testing';

import { TargetAudienceService } from './target-audience.service';

describe('TargetAudienceService', () => {
  let service: TargetAudienceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TargetAudienceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
