import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PosterListComponent } from './components/poster-list/poster-list.component';
import { PosterComponent } from './components/poster/poster.component';
import { JudgeListComponent } from './components/judge-list/judge-list.component';
import { JudgeComponent } from './components/judge/judge.component';
import { FinalReportComponent } from './components/final-report/final-report.component';
import { AuthGuard } from './guards/auth.guard';
import { ImportDataComponent } from './components/import-data/import-data.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'posters', component: PosterListComponent, canActivate: [AuthGuard] },
  { path: 'poster/:id', component: PosterComponent, canActivate: [AuthGuard] },
  { path: 'judges', component: JudgeListComponent, canActivate: [AuthGuard] },
  { path: 'judge/:id', component: JudgeComponent, canActivate: [AuthGuard] },
  { path: 'final-report', component: FinalReportComponent, canActivate: [AuthGuard] },
  { path: 'import-data', component: ImportDataComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
