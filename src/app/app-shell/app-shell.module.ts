import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppShellRoutingModule } from './app-shell-routing.module';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';       

import { SupportComponent } from '../support/support.component';

@NgModule({
  declarations: [
    MainLayoutComponent,
    SupportComponent,                              
  ],
  imports: [
    CommonModule,
    RouterModule,
    AppShellRoutingModule,
    MatIconModule,
    FormsModule,                                       
  ]
})
export class AppShellModule {}
