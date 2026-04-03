import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgeComponent } from './judge.component';

describe('Judge', () => {
  let component: JudgeComponent;
  let fixture: ComponentFixture<JudgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JudgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JudgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
