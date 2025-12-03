// src/app/stats/stats.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsComponent } from './stats.component';
import { StatsRoutingModule } from './stats-routing.module';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  declarations: [
    StatsComponent
  ],
  imports: [
    CommonModule,
    StatsRoutingModule,
    NgChartsModule    // ✅ important
  ]
})
export class StatsModule {}
