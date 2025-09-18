import { TestBed } from '@angular/core/testing';

import { Judge } from './judge';

describe('Judge', () => {
  let service: Judge;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Judge);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
