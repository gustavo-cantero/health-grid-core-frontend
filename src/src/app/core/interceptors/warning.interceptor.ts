import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';

// Muestra un aviso cuando la API responde correctamente pero incluye un campo
// `warning` en el cuerpo. Es el caso en que un cambio se guardó localmente pero
// no se pudo sincronizar con el servicio de turnos.
export const warningInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    tap((event) => {
      if (!(event instanceof HttpResponse)) return;
      const body = event.body as { warning?: unknown } | null;
      if (body && typeof body === 'object' && typeof body.warning === 'string' && body.warning.trim()) {
        toast.showWarning(body.warning);
      }
    }),
  );
};
