import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalReport } from './final-report.component';

describe('FinalReport', () => {
  let component: FinalReport;
  let fixture: ComponentFixture<FinalReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
