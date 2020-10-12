import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FinalReportComponent } from './final-report/final-report.component';
import { JudgeListComponent } from './judge-list/judge-list.component';
import { LogoutComponent } from './logout/logout.component';
import { PosterListComponent } from './poster-list/poster-list.component';


const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'posterlist', component: PosterListComponent },
  { path: 'judgelist', component: JudgeListComponent },
  { path: 'finalReport', component: FinalReportComponent },
  { path: 'logout', component: LogoutComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
