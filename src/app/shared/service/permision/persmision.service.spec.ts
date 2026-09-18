import { TestBed } from '@angular/core/testing';

import { PersmisionService } from './persmision.service';

describe('PersmisionService', () => {
  let service: PersmisionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersmisionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
