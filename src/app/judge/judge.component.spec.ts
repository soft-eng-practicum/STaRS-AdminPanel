import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgeComponent } from './judge.component';

describe('JudgeComponent', () => {
  let component: JudgeComponent;
  let fixture: ComponentFixture<JudgeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JudgeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JudgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
