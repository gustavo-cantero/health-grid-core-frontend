import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Crea un guard que solo permite activar la ruta si la sesión tiene el permiso
 * requerido. Si no lo tiene, lo manda al inicio: la sesión es válida igual, así
 * que sigue pudiendo usar el menú lateral aunque este ABM le quede vedado.
 */
export function permissionGuard(required: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.has(required)) return true;
    return router.createUrlTree(['/inicio']);
  };
}
