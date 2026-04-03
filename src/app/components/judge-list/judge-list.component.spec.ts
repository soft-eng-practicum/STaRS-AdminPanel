import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgeList } from './judge-list.component';

describe('JudgeList', () => {
  let component: JudgeList;
  let fixture: ComponentFixture<JudgeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JudgeList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JudgeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
