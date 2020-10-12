import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { JudgeListComponent } from './judge-list/judge-list.component';
import { PosterListComponent } from './poster-list/poster-list.component';


const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'posterlist', component: PosterListComponent },
  { path: 'judgelist', component: JudgeListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
