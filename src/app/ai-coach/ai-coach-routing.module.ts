import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AiCoachComponent } from './ai-coach.component';

const routes: Routes = [
  { path: '', component: AiCoachComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AiCoachRoutingModule {}
