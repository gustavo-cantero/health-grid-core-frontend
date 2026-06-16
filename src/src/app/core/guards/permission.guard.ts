import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Crea un guard que solo permite activar la ruta si la sesión tiene el permiso
 * requerido. Si no lo tiene, redirige al primer módulo que el usuario sí pueda
 * ver, o al login si no tiene acceso a ninguno.
 */
export function permissionGuard(required: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.has(required)) return true;
    const fallback = auth.firstAllowedModuleRoute();
    return router.createUrlTree([fallback ?? '/login']);
  };
}
