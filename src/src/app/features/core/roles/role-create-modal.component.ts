import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { RoleService } from '../../../core/services/role.service';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-role-create-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './role-create-modal.component.html',
  styleUrls: ['./role-create-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
