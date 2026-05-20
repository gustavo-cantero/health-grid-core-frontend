import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="toast"
      [class.show]="visible()"
      role="status"
      aria-live="polite"
    >
      {{ message() ?? '' }}
    </div>
  `,
})
export class ToastComponent {
  private readonly toast = inject(ToastService);
  readonly message = this.toast.message;
  readonly visible = computed(() => this.message() !== null);
}
