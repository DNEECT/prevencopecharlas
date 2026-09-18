import { TestBed } from '@angular/core/testing';

import { RoleRepository } from './role.repository';

describe('RoleRepository', () => {
  let service: RoleRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoleRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
