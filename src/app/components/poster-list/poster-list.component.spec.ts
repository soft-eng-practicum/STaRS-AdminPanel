import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PosterList } from './poster-list.component';

describe('PosterList', () => {
  let component: PosterList;
  let fixture: ComponentFixture<PosterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PosterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PosterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
