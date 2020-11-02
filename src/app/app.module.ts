import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { PouchService } from './pouch-service.service';
import { HttpClientModule } from '@angular/common/http';
import { ComponentModule } from './Components/component/component.module';
import { DashboardComponent } from './Components/dashboard/dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    ComponentModule,
    RouterModule.forRoot([
      { path: '', component: DashboardComponent, pathMatch: 'full' },
      { path: '**', redirectTo: '', pathMatch: 'full' }
    ]),
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [
    PouchService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
