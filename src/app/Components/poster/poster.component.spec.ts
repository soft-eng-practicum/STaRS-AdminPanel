import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PosterComponent } from './poster.component';

describe('PosterComponent', () => {
  let component: PosterComponent;
  let fixture: ComponentFixture<PosterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PosterComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PosterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
