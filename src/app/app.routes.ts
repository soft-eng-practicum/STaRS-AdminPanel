import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { Dashboard } from './components/dashboard/dashboard.component';
import { PosterList } from './components/poster-list/poster-list.component';
import { Poster } from './components/poster/poster.component';
import { JudgeList } from './components/judge-list/judge-list.component';
import { Judge } from './components/judge/judge.component';
import { FinalReport } from './components/final-report/final-report.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: Dashboard },
  { path: 'posters', component: PosterList },
  { path: 'poster/:id', component: Poster },
  { path: 'judges', component: JudgeList },
  { path: 'judge/:id', component: Judge },
  { path: 'final-report', component: FinalReport },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
