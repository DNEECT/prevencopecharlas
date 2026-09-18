import { TestBed } from '@angular/core/testing';

import { ElectoralprocessService } from './electoralprocess.service';

describe('ElectoralprocessService', () => {
  let service: ElectoralprocessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElectoralprocessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
