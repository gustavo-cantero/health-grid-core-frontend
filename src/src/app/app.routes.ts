import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { PERMISSIONS } from './core/auth/permissions';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'auth/verify-account',
    loadComponent: () =>
      import('./features/auth/verify-account/verify-account.component').then(
        (m) => m.VerifyAccountComponent,
      ),
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: 'core', pathMatch: 'full', redirectTo: 'core/users' },
      {
        path: 'core/users',
        canActivate: [permissionGuard(PERMISSIONS.users.read)],
        loadComponent: () =>
          import('./features/core/users/users-list.component').then((m) => m.UsersListComponent),
      },
      {
        path: 'core/account-verification',
        canActivate: [permissionGuard(PERMISSIONS.users.create)],
        loadComponent: () =>
          import('./features/core/account-verification/account-verification.component').then(
            (m) => m.AccountVerificationComponent,
          ),
      },
      {
        path: 'core/roles',
        canActivate: [permissionGuard(PERMISSIONS.roles.read)],
        loadComponent: () =>
          import('./features/core/roles/roles-page.component').then((m) => m.RolesPageComponent),
      },
      {
        path: 'core/permissions',
        canActivate: [permissionGuard(PERMISSIONS.permissions.read)],
        loadComponent: () =>
          import('./features/core/permissions/permissions-list.component').then(
            (m) => m.PermissionsListComponent,
          ),
      },
      {
        path: 'core/specialities',
        canActivate: [permissionGuard(PERMISSIONS.specialities.read)],
        loadComponent: () =>
          import('./features/core/specialities/specialities-list.component').then(
            (m) => m.SpecialitiesListComponent,
          ),
      },
      {
        path: 'core/locations',
        canActivate: [permissionGuard(PERMISSIONS.locations.read)],
        loadComponent: () =>
          import('./features/core/locations/locations-list.component').then(
            (m) => m.LocationsListComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
