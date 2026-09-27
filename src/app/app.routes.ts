import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'properties' },
  {
    path: 'properties',
    loadComponent: () =>
      import('./features/property-listing/property-listing.component').then((m) => m.PropertyListingComponent),
  },
  {
    path: 'properties/:id',
    loadComponent: () =>
      import('./features/property-detail/property-detail.component').then((m) => m.PropertyDetailComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [roleGuard('BUSINESS')],
    loadComponent: () =>
      import('./features/business-dashboard/business-dashboard.component').then((m) => m.BusinessDashboardComponent),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () => import('./features/admin-panel/admin-panel.component').then((m) => m.AdminPanelComponent),
  },
  { path: '**', redirectTo: 'properties' },
];
