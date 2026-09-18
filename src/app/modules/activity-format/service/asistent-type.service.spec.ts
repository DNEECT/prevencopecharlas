import { TestBed } from '@angular/core/testing';

import { AsistentTypeService } from './asistent-type.service';

describe('AsistentTypeService', () => {
  let service: AsistentTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AsistentTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
