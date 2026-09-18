import { TestBed } from '@angular/core/testing';

import { ActionsRepository } from './actions.repository';

describe('ActionsRepository', () => {
  let service: ActionsRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActionsRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
