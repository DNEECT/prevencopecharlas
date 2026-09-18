import { TestBed } from '@angular/core/testing';

import { AuthenticationRepository } from './authentication.repository';

describe('AuthenticationRepository', () => {
  let service: AuthenticationRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthenticationRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
