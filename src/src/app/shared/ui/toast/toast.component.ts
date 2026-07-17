import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private readonly toast = inject(ToastService);
  readonly message = this.toast.message;
  readonly variant = this.toast.variant;
  readonly visible = computed(() => this.message() !== null);
}
