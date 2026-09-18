import { TestBed } from '@angular/core/testing';

import { TargetAudienceRepository } from './target-audience.repository';

describe('TargetAudienceRepository', () => {
  let service: TargetAudienceRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TargetAudienceRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
