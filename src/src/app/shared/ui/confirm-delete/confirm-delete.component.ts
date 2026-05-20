import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-delete',
  imports: [ModalComponent],
  templateUrl: './confirm-delete.component.html',
  styleUrls: ['./confirm-delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteComponent {
  readonly open = input<boolean>(false);
  readonly entityLabel = input.required<string>();
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
