import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PosterListComponent } from './components/poster-list/poster-list.component';
import { PosterComponent } from './components/poster/poster.component';
import { JudgeListComponent } from './components/judge-list/judge-list.component';
import { JudgeComponent } from './components/judge/judge.component';
import { FinalReportComponent } from './components/final-report/final-report.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'posters', component: PosterListComponent },
  { path: 'poster/:id', component: PosterComponent },
  { path: 'judges', component: JudgeListComponent },
  { path: 'judge/:id', component: JudgeComponent },
  { path: 'final-report', component: FinalReportComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
