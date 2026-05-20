import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        m => m.ForgotPasswordComponent,
      ),
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'core', pathMatch: 'full', redirectTo: 'core/users' },
      {
        path: 'core/users',
        loadComponent: () =>
          import('./features/core/users/users-list.component').then(m => m.UsersListComponent),
      },
      {
        path: 'core/roles',
        loadComponent: () =>
          import('./features/core/roles/roles-page.component').then(m => m.RolesPageComponent),
      },
      {
        path: 'core/permissions',
        loadComponent: () =>
          import('./features/core/permissions/permissions-list.component').then(
            m => m.PermissionsListComponent,
          ),
      },
      {
        path: 'core/specialities',
        loadComponent: () =>
          import('./features/core/specialities/specialities-list.component').then(
            m => m.SpecialitiesListComponent,
          ),
      },
      {
        path: 'core/locations',
        loadComponent: () =>
          import('./features/core/locations/locations-list.component').then(
            m => m.LocationsListComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
