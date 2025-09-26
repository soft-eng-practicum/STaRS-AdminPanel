import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PosterListComponent } from './poster-list.component';

describe('PosterList', () => {
  let component: PosterListComponent;
  let fixture: ComponentFixture<PosterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PosterListComponent],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PosterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
