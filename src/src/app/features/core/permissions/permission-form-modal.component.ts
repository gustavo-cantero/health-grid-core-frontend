import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { PermissionService } from '../../../core/services/permission.service';
import { Permission } from '../../../core/models/permission.model';

@Component({
  selector: 'app-permission-form-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      [title]="title()"
      [maxWidth]="420"
      (close)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-group">
          <label for="perm-name">Nombre</label>
          <input id="perm-name" type="text" formControlName="name" placeholder="Ej: reports:export"
            [attr.aria-describedby]="form.get('name')?.invalid && form.get('name')?.touched ? 'perm-name-error' : null"
            [attr.aria-invalid]="form.get('name')?.invalid && form.get('name')?.touched ? 'true' : null" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <span id="perm-name-error" class="form-error" role="alert">Este campo es obligatorio</span>
          }
        </div>
        <p class="api-note">{{ apiNote() }}</p>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
          <button type="submit" class="btn-main" [disabled]="loading()">
            {{ existing() ? 'Guardar cambios' : 'Crear permiso' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class PermissionFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly perms = inject(PermissionService);

  readonly open = input<boolean>(false);
  readonly existing = input<Permission | null>(null);
  readonly close = output<void>();
  readonly saved = output<Permission>();

  protected readonly loading = signal<boolean>(false);

  protected readonly title = computed(() => this.existing() ? 'Editar permiso' : 'Nuevo permiso');
  protected readonly apiNote = computed(() =>
    this.existing() ? '→ PUT /permissions/{id}' : '→ POST /permissions',
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        const e = this.existing();
        this.form.reset({ name: e?.name ?? '' });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = { name: this.form.getRawValue().name };
    this.loading.set(true);
    const existing = this.existing();
    const obs$ = existing ? this.perms.update(existing.id, payload) : this.perms.create(payload);
    obs$.subscribe(p => {
      this.loading.set(false);
      this.saved.emit(p);
    });
  }
}
