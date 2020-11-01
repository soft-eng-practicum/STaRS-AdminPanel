import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { FinalReportComponent } from './Components/final-report/final-report.component';
import { JudgeListComponent } from './Components/judge-list/judge-list.component';
import { LogoutComponent } from './Components/logout/logout.component';
import { PosterListComponent } from './Components/poster-list/poster-list.component';

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
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
