import { TestBed } from '@angular/core/testing';

import { ConsultRepository } from './consult.repository';

describe('ConsultRepository', () => {
  let service: ConsultRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsultRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
