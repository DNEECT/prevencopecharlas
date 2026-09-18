import { TestBed } from '@angular/core/testing';

import { PermissionRepository } from './permission.repository';

describe('PermissionRepository', () => {
  let service: PermissionRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermissionRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
