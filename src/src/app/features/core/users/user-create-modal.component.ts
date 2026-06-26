import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ConfirmUnsavedComponent } from '../../../shared/ui/confirm-unsaved/confirm-unsaved.component';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-user-create-modal',
  imports: [ModalComponent, ReactiveFormsModule, ConfirmUnsavedComponent],
  templateUrl: './user-create-modal.component.html',
  styleUrls: ['./user-create-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreateModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly users = inject(UserService);
  private readonly rolesService = inject(RoleService);
  private readonly auth = inject(AuthService);

  readonly open = input<boolean>(false);
  readonly close = output<void>();
  readonly created = output<User>();

  protected readonly loading = signal<boolean>(false);
  protected readonly confirmingCancel = signal<boolean>(false);
  protected readonly roles = this.rolesService.roles;
  protected readonly assignableRoles = computed(() => {
    const isAdmin = this.auth.currentUser()?.role.trim().toLowerCase() === 'admin';
    return isAdmin
      ? this.roles()
      : this.roles().filter((role: Role) => role.name.trim().toLowerCase() !== 'admin');
  });

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    roleId: [0, [Validators.required, Validators.min(1)]],
  });

  protected readonly isDirty = computed(() => this.form.dirty);

  ngOnInit(): void {
    this.rolesService.list().subscribe();
  }

  requestClose(): void {
    if (this.isDirty()) {
      this.confirmingCancel.set(true);
    } else {
      this.close.emit();
    }
  }

  confirmClose(): void {
    this.confirmingCancel.set(false);
    this.close.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { roleId, ...rest } = this.form.getRawValue();
    this.users
      .create({ ...rest, roleId })
      .pipe(switchMap((user) => this.users.get(user.id)))
      .subscribe((user) => {
        this.loading.set(false);
        this.form.reset({ firstName: '', lastName: '', email: '', roleId: 0 });
        this.created.emit(user);
      });
  }
}
