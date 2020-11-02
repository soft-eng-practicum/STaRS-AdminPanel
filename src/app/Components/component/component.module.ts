import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinalReportComponent } from '../final-report/final-report.component';
import { JudgeComponent } from '../judge/judge.component';
import { JudgeListComponent } from '../judge-list/judge-list.component';
import { PosterComponent } from '../poster/poster.component';
import { LogoutComponent } from '../logout/logout.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { PosterListComponent } from '../poster-list/poster-list.component';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [

  { path: 'dashboard', component: DashboardComponent },
  { path: 'posterlist', component: PosterListComponent },
  { path: 'judgelist', component: JudgeListComponent },
  { path: 'finalReport', component: FinalReportComponent },
  { path: 'logout', component: LogoutComponent },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
      FinalReportComponent,
      JudgeComponent,
      JudgeListComponent,
      LogoutComponent,
      PosterComponent,
      DashboardComponent,
      PosterListComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    FinalReportComponent,
    JudgeComponent,
    JudgeListComponent,
    LogoutComponent,
    PosterComponent,
    DashboardComponent,
    PosterListComponent
  ],
  providers: [
  ],
})
export class ComponentModule { }
