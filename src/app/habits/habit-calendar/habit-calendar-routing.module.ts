import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HabitCalendarComponent } from './habit-calendar.component';

const routes: Routes = [
  { path: '', component: HabitCalendarComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HabitCalendarRoutingModule {}
