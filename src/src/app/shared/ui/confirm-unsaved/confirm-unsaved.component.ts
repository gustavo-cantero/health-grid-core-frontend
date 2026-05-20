import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-unsaved',
  imports: [ModalComponent],
  templateUrl: './confirm-unsaved.component.html',
  styleUrls: ['./confirm-unsaved.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmUnsavedComponent {
  readonly open = input<boolean>(false);
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
