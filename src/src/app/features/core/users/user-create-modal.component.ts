import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-create-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      title="Nuevo usuario"
      (close)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label for="uc-first">Nombre</label>
            <input id="uc-first" type="text" formControlName="firstName" placeholder="María" />
          </div>
          <div class="form-group">
            <label for="uc-last">Apellido</label>
            <input id="uc-last" type="text" formControlName="lastName" placeholder="Alvarez" />
          </div>
        </div>
        <div class="form-group">
          <label for="uc-email">Email</label>
          <input id="uc-email" type="email" formControlName="email" placeholder="m.alvarez@healthgrid.com" />
        </div>
        <div class="form-group">
          <label for="uc-pass">
            Contraseña
            <span style="color:#999;font-weight:400;text-transform:none;font-size:11px">(mín. 6 caracteres)</span>
          </label>
          <input id="uc-pass" type="password" formControlName="password" placeholder="••••••••" autocomplete="new-password" />
        </div>
        <p class="api-note">→ POST /users — Los roles y especialidades se asignan luego desde "Editar usuario".</p>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
          <button type="submit" class="btn-main" [disabled]="loading()">
            {{ loading() ? 'Creando…' : 'Crear usuario' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class UserCreateModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly users = inject(UserService);

  readonly open = input<boolean>(false);
  readonly close = output<void>();
  readonly created = output<User>();

  protected readonly loading = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.users.create(this.form.getRawValue()).subscribe(user => {
      this.loading.set(false);
      this.form.reset({ firstName: '', lastName: '', email: '', password: '' });
      this.created.emit(user);
    });
  }
}
