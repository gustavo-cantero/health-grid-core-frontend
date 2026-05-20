import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-profile-edit-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      title="Editar mi perfil"
      [maxWidth]="420"
      (close)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-group">
          <label for="profile-name">Nombre</label>
          <input id="profile-name" type="text" formControlName="name"
            [attr.aria-describedby]="form.get('name')?.invalid && form.get('name')?.touched ? 'profile-name-error' : null"
            [attr.aria-invalid]="form.get('name')?.invalid && form.get('name')?.touched ? 'true' : null" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <span id="profile-name-error" class="form-error" role="alert">Este campo es obligatorio</span>
          }
        </div>
        <div class="form-group">
          <label for="profile-email">Email</label>
          <input id="profile-email" type="email" formControlName="email"
            [attr.aria-describedby]="form.get('email')?.invalid && form.get('email')?.touched ? 'profile-email-error' : null"
            [attr.aria-invalid]="form.get('email')?.invalid && form.get('email')?.touched ? 'true' : null" />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <span id="profile-email-error" class="form-error" role="alert">
              @if (form.get('email')?.hasError('required')) { Este campo es obligatorio }
              @else { Ingresá un email válido }
            </span>
          }
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
          <button type="submit" class="btn-main">Guardar cambios</button>
        </div>
      </form>
    </app-modal>
  `,
})
export class ProfileEditModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly open = input<boolean>(false);
  readonly close = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        const u = this.auth.currentUser();
        this.form.reset({ name: u?.name ?? '', email: u?.email ?? '' });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.auth.updateMyProfile(this.form.getRawValue());
    this.toast.show('Perfil actualizado correctamente');
    this.close.emit();
  }
}
