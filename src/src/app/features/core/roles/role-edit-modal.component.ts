import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ChipsInputComponent, ChipOption } from '../../../shared/ui/chips-input/chips-input.component';
import { RoleService } from '../../../core/services/role.service';
import { PermissionService } from '../../../core/services/permission.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-role-edit-modal',
  imports: [ModalComponent, ReactiveFormsModule, ChipsInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      [title]="title()"
      [maxWidth]="480"
      (close)="close.emit()"
    >
      @if (role(); as r) {
        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="form-group">
            <label for="re-name">Nombre del rol</label>
            <input id="re-name" type="text" formControlName="name"
              [attr.aria-describedby]="form.get('name')?.invalid && form.get('name')?.touched ? 're-name-error' : null"
              [attr.aria-invalid]="form.get('name')?.invalid && form.get('name')?.touched ? 'true' : null" />
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <span id="re-name-error" class="form-error" role="alert">Este campo es obligatorio</span>
            }
          </div>

          <app-chips-input
            assignedLabel="Permisos asignados"
            addLabel="Agregar permiso"
            placeholder="Seleccioná un permiso..."
            [assigned]="assignedPerms()"
            [available]="availablePerms()"
            (add)="onAddPerm($event)"
            (remove)="onRemovePerm($event)"
          />

          <p class="api-note">→ PUT /roles/{{ '{' }}id{{ '}' }}</p>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
            <button type="submit" class="btn-main" [disabled]="loading()">Guardar cambios</button>
          </div>
        </form>
      }
    </app-modal>
  `,
})
export class RoleEditModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly roles = inject(RoleService);
  private readonly perms = inject(PermissionService);
  private readonly toast = inject(ToastService);

  readonly open = input<boolean>(false);
  readonly role = input<Role | null>(null);
  readonly close = output<void>();
  readonly updated = output<Role>();

  protected readonly loading = signal<boolean>(false);
  protected readonly draftPermIds = signal<number[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  protected readonly title = computed(() => {
    const r = this.role();
    return r ? `Editar rol — ${r.name}` : 'Editar rol';
  });

  protected readonly assignedPerms = computed<ChipOption[]>(() =>
    this.perms.permissions()
      .filter(p => this.draftPermIds().includes(p.id))
      .map(p => ({ id: p.id, label: p.name })),
  );

  protected readonly availablePerms = computed<ChipOption[]>(() =>
    this.perms.permissions()
      .filter(p => !this.draftPermIds().includes(p.id))
      .map(p => ({ id: p.id, label: p.name })),
  );

  constructor() {
    effect(() => {
      const r = this.role();
      if (r && this.open()) {
        this.form.reset({ name: r.name });
        this.draftPermIds.set([...r.permissionIds]);
      }
    });
  }

  save(): void {
    const r = this.role();
    if (!r || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.roles.update(r.id, { name: this.form.getRawValue().name, permissionIds: this.draftPermIds() }).subscribe(saved => {
      this.loading.set(false);
      this.toast.show(`Rol "${saved.name}" actualizado correctamente`);
      this.updated.emit(saved);
    });
  }

  onAddPerm(permId: number): void { this.draftPermIds.update(ids => [...ids, permId]); }
  onRemovePerm(permId: number): void { this.draftPermIds.update(ids => ids.filter(id => id !== permId)); }
}
