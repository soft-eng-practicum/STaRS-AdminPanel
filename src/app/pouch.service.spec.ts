import { TestBed } from '@angular/core/testing';

import { PouchService } from './pouch.service';

describe('PouchService', () => {
  let service: PouchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PouchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
