import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CORE_MODULES } from '../../core/auth/permissions';

/**
 * Aterrizaje tras iniciar sesión. No exige ningún permiso: una sesión válida
 * alcanza para entrar, aunque el usuario no tenga acceso a ningún ABM del core
 * (en ese caso usa el menú lateral para ir a los otros módulos de la plataforma).
 */
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly auth = inject(AuthService);

  protected readonly userName = computed(() => this.auth.currentUser()?.name ?? '');

  // Accesos directos a los ABM que el usuario sí puede leer; vacío es un estado válido.
  protected readonly coreModules = computed(() =>
    CORE_MODULES.filter((m) => this.auth.has(m.read)),
  );
}
