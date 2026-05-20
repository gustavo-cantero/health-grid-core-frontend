import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <span class="topbar-action">{{ greeting() }}</span>
    </header>
  `,
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);

  protected readonly greeting = computed(() => {
    const user = this.auth.currentUser();
    return user ? `Hola, ${user.name}` : 'Bienvenido';
  });
}
