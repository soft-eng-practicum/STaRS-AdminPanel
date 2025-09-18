import { TestBed } from '@angular/core/testing';

import { Poster } from './poster';

describe('Poster', () => {
  let service: Poster;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Poster);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
