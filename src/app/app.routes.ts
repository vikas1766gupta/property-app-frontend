import { UrlMatchResult, UrlSegment, Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export function seoLocationMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length !== 1 || !/-in-[a-z0-9-]+$/.test(segments[0].path)) return null;
  return { consumed: segments };
}

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
    path: 'projects',
    loadComponent: () => import('./features/project-listing/project-listing.component').then((m) => m.ProjectListingComponent),
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./features/project-detail/project-detail.component').then((m) => m.ProjectDetailComponent),
  },
  {
    path: 'businesses/:id',
    loadComponent: () => import('./features/business-profile/business-profile.component').then((m) => m.BusinessProfileComponent),
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
    path: 'admin/register',
    loadComponent: () => import('./features/auth/admin-register/admin-register.component').then((m) => m.AdminRegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [roleGuard('BUSINESS')],
    loadComponent: () =>
      import('./features/business-dashboard/business-dashboard.component').then((m) => m.BusinessDashboardComponent),
  },
  {
    path: 'dashboard/projects',
    canActivate: [roleGuard('BUSINESS')],
    loadComponent: () => import('./features/project-dashboard/project-dashboard.component').then((m) => m.ProjectDashboardComponent),
  },
  {
    path: 'pricing',
    canActivate: [roleGuard('BUSINESS')],
    loadComponent: () => import('./features/pricing/pricing.component').then((m) => m.PricingComponent),
  },
  {
    path: 'saved',
    canActivate: [roleGuard('BUYER')],
    loadComponent: () =>
      import('./features/favorite/saved-properties.component').then((m) => m.SavedPropertiesComponent),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () => import('./features/admin-panel/admin-panel.component').then((m) => m.AdminPanelComponent),
  },
  {
    matcher: seoLocationMatcher,
    loadComponent: () => import('./features/seo-location/seo-location.component').then((m) => m.SeoLocationComponent),
  },
  { path: '**', redirectTo: 'properties' },
];
