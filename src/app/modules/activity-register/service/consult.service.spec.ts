import { TestBed } from '@angular/core/testing';

import { ConsultService } from './consult.service';

describe('ConsultService', () => {
  let service: ConsultService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsultService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
