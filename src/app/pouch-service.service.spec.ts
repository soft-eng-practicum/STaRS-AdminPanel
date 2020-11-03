import { TestBed } from '@angular/core/testing';

import { PouchService } from './pouch-service.service';

describe('PouchServiceService', () => {
  let service: PouchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PouchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should grab posters from pouchdb', () => {
    service.getPoster();
    /* expect(service.posterName).toBeTruthy();
    expect(service.posterids).toBeTruthy();
    expect(service.posterTitle).toBeTruthy();
    expect(service.advisorName).toBeTruthy(); */
    expect(service.mattsList).toBeTruthy();
  });
});
