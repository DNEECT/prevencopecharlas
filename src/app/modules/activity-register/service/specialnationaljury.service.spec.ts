import { TestBed } from '@angular/core/testing';

import { SpecialnationaljuryService } from './specialnationaljury.service';

describe('SpecialnationaljuryService', () => {
  let service: SpecialnationaljuryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpecialnationaljuryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
