import { TestBed } from '@angular/core/testing';

import { AsistentTypeRepository } from './asistent-type.repository';

describe('AsistentTypeRepository', () => {
  let service: AsistentTypeRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AsistentTypeRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
