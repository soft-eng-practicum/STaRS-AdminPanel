import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Poster } from './poster.component';

describe('Poster', () => {
  let component: Poster;
  let fixture: ComponentFixture<Poster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Poster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Poster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
