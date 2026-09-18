import { TestBed } from '@angular/core/testing';

import { UserPasswordResolver } from './user-password.resolver';

describe('UserPasswordResolver', () => {
  let service: UserPasswordResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserPasswordResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
