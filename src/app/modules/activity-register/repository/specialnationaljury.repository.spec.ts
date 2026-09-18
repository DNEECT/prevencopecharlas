import { TestBed } from '@angular/core/testing';

import { SpecialnationaljuryRepository } from './specialnationaljury.repository';

describe('SpecialnationaljuryRepository', () => {
  let service: SpecialnationaljuryRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpecialnationaljuryRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
