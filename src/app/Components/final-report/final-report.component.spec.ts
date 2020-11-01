import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FinalReportComponent } from './final-report.component';

describe('FinalReportComponent', () => {
  let component: FinalReportComponent;
  let fixture: ComponentFixture<FinalReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FinalReportComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FinalReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
