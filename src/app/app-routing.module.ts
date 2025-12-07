import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  // Root path → go to landing page
  { path: '', redirectTo: 'landing', pathMatch: 'full' },

  // Landing page module
  {
    path: 'landing',
    loadChildren: () =>
      import('./landing/landing.module').then((m) => m.LandingModule),
  },

  // Auth module routes (/auth/login, /auth/signup)
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then((m) => m.AuthModule),
  },

  // 🔹 Short URLs for auth
  // /login  → /auth/login
  // /signup → /auth/signup
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'signup', redirectTo: 'auth/signup', pathMatch: 'full' },

  // 🔐 Protected app shell (/app/...) – only for logged-in users
  {
    path: 'app',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-shell/app-shell.module').then((m) => m.AppShellModule),
  },

  // 404 page module
  {
    path: '404',
    loadChildren: () =>
      import('./not-found/not-found.module').then((m) => m.NotFoundModule),
  },

  // Wildcard: anything unknown → 404
  { path: '**', redirectTo: '404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
