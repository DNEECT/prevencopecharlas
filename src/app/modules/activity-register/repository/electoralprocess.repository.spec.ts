import { TestBed } from '@angular/core/testing';

import { ElectoralprocessRepository } from './electoralprocess.repository';

describe('ElectoralprocessRepository', () => {
  let service: ElectoralprocessRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElectoralprocessRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
