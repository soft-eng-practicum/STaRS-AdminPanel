import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Judge } from './judge.component';

describe('Judge', () => {
  let component: Judge;
  let fixture: ComponentFixture<Judge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Judge]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Judge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
