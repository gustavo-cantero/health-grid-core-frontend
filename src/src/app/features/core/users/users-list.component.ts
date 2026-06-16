import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { User } from '../../../core/models/user.model';
import { UserCreateModalComponent } from './user-create-modal.component';
import { UserEditModalComponent } from './user-edit-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';
import { HasPermissionDirective } from '../../../core/auth/has-permission.directive';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-users-list',
  imports: [
    ReactiveFormsModule,
    UserCreateModalComponent,
    UserEditModalComponent,
    ConfirmDeleteComponent,
    HasPermissionDirective,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  protected readonly users = this.userService.users;
  protected readonly openCreate = signal<boolean>(false);
  protected readonly editing = signal<User | null>(null);
  protected readonly deleting = signal<User | null>(null);
  protected readonly page = signal<number>(1);

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });
  protected readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  protected readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.users();
    return this.users().filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      return fullName.includes(term) || u.email.toLowerCase().includes(term);
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  protected readonly paged = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  protected readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  ngOnInit(): void {
    // /users ya trae roles, especialidades y ubicaciones anidados, así que un
    // único endpoint alcanza para pintar el listado.
    this.userService.list().subscribe();
  }

  prev(): void {
    if (this.page() > 1) this.page.update((p) => p - 1);
  }
  next(): void {
    if (this.page() < this.totalPages()) this.page.update((p) => p + 1);
  }

  initials(u: User): string {
    return ((u.firstName.charAt(0) ?? '') + (u.lastName.charAt(0) ?? '')).toUpperCase();
  }

  avatarBg(u: User): string {
    const palette = ['#d4ece2', '#d6eaf5', '#fdecd0', '#fce8e8', '#e3e5fa'];
    return palette[u.id % palette.length];
  }
  avatarFg(u: User): string {
    const palette = ['#004C36', '#1a4d6b', '#7a4500', '#7a1f1f', '#272F79'];
    return palette[u.id % palette.length];
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  onCreated(user: User): void {
    this.openCreate.set(false);
    this.toast.show(`Usuario "${user.firstName} ${user.lastName}" creado correctamente`);
  }

  // Pide el detalle del usuario a la API antes de abrir el modal de edición.
  edit(u: User): void {
    this.userService.get(u.id).subscribe((detail) => this.editing.set(detail));
  }

  onUpdated(_user: User): void {
    this.editing.set(null);
  }

  confirmDelete(): void {
    const u = this.deleting();
    if (!u) return;
    this.userService.remove(u.id).subscribe(() => {
      this.deleting.set(null);
      this.toast.show('Usuario eliminado (soft delete aplicado)');
    });
  }
}
