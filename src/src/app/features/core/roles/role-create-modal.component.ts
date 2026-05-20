import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { RoleService } from '../../../core/services/role.service';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-role-create-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      title="Nuevo rol"
      [maxWidth]="420"
      (close)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-group">
          <label for="rc-name">Nombre del rol</label>
          <input id="rc-name" type="text" formControlName="name" placeholder="Ej: Enfermero"
            [attr.aria-describedby]="form.get('name')?.invalid && form.get('name')?.touched ? 'rc-name-error' : null"
            [attr.aria-invalid]="form.get('name')?.invalid && form.get('name')?.touched ? 'true' : null" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <span id="rc-name-error" class="form-error" role="alert">Este campo es obligatorio</span>
          }
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
          <button type="submit" class="btn-main" [disabled]="loading()">Crear rol</button>
        </div>
      </form>
    </app-modal>
  `,
})
export class RoleCreateModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly roles = inject(RoleService);

  readonly open = input<boolean>(false);
  readonly close = output<void>();
  readonly created = output<Role>();

  protected readonly loading = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.roles.create({ name: this.form.getRawValue().name }).subscribe(role => {
      this.loading.set(false);
      this.form.reset({ name: '' });
      this.created.emit(role);
    });
  }
}
