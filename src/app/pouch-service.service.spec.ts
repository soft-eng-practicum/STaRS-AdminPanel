import { TestBed } from '@angular/core/testing';

import { PouchServiceService } from './pouch-service.service';

describe('PouchServiceService', () => {
  let service: PouchServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PouchServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
