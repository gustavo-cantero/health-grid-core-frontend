import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Punto de entrada para el handoff de sesión entre módulos de la plataforma.
 *
 * Otro módulo (ya autenticado contra la misma Core API) redirige al usuario a
 * `/auth/sso?ticket=<ticket>&redirect=/core/users`. El `ticket` es de un solo
 * uso y de vida corta (~60 s), emitido por el core; este componente lo canjea
 * contra `POST /auth/sso-exchange` por un JWT fresco y deja al usuario logueado
 * sin volver a pedir credenciales.
 *
 * El JWT nunca viaja en la URL: sólo el ticket, que es de bajo valor (expira en
 * segundos y no se puede reusar). El `ticket` y el `redirect` también se aceptan
 * en el fragment (`#ticket=...`) para que no queden en logs de servidor ni en el
 * `Referer`. `redirect` es opcional y sólo admite rutas internas.
 */
@Component({
  selector: 'app-sso',
  imports: [RouterLink],
  templateUrl: './sso.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SsoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const { ticket, redirect } = this.readParams();

    if (!ticket) {
      this.error.set('El enlace de acceso no incluye un ticket SSO.');
      return;
    }

    this.auth.establishSessionFromTicket(ticket).subscribe({
      next: () => {
        const target = this.safeRedirect(redirect) ?? '/inicio';
        // replaceUrl para que el ticket no quede en el historial de navegación.
        void this.router.navigateByUrl(target, { replaceUrl: true });
      },
      error: (err: Error) => this.error.set(err.message || 'No se pudo iniciar la sesión.'),
    });
  }

  /**
   * Lee el ticket y el destino, priorizando el fragment (#ticket=...) sobre el
   * query string (?ticket=...). Acepta `code` como alias de `ticket` y `next`
   * como alias de `redirect`, para tolerar la convención de otros módulos.
   */
  private readParams(): { ticket: string | null; redirect: string | null } {
    const snap = this.route.snapshot;
    const frag = snap.fragment ? new URLSearchParams(snap.fragment) : null;
    const q = snap.queryParamMap;
    return {
      ticket: frag?.get('ticket') ?? frag?.get('code') ?? q.get('ticket') ?? q.get('code'),
      redirect: frag?.get('redirect') ?? frag?.get('next') ?? q.get('redirect') ?? q.get('next'),
    };
  }

  /** Sólo permite rutas internas absolutas; descarta URLs externas (open redirect). */
  private safeRedirect(path: string | null): string | null {
    if (!path) return null;
    if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return null;
    return path;
  }
}
