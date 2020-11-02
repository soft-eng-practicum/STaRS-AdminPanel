import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ComponentModule } from './Components/component/component.module'


@NgModule({
  imports: [ComponentModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }
