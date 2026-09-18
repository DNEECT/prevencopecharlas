import { TestBed } from '@angular/core/testing';

import { PermisionDataService } from './permision-data.service';

describe('PermisionDataService', () => {
  let service: PermisionDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermisionDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
