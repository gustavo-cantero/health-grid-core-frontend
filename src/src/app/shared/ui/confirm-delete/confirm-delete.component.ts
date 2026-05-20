import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-delete',
  imports: [ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      title="Confirmar eliminación"
      [maxWidth]="380"
      (close)="cancel.emit()"
    >
      <p style="font-size:14px;color:#444;line-height:1.7">
        ¿Estás seguro que querés eliminar este <strong>{{ entityLabel() }}</strong>?<br>
        Esta acción realiza un <em>soft delete</em> — el registro queda inactivo
        (se setea <code>deleted_at</code>) pero no se borra físicamente de la base de datos.
      </p>
      <div class="modal-footer">
        <button type="button" class="btn-cancel" (click)="cancel.emit()">Cancelar</button>
        <button type="button" class="btn-destroy" (click)="confirm.emit()">Sí, eliminar</button>
      </div>
    </app-modal>
  `,
})
export class ConfirmDeleteComponent {
  readonly open = input<boolean>(false);
  readonly entityLabel = input.required<string>();
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
