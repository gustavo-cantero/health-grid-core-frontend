import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { SpecialityService } from '../../../core/services/speciality.service';
import { LocationService } from '../../../core/services/location.service';
import { ToastService } from '../../../shared/services/toast.service';
import { User } from '../../../core/models/user.model';
import { UserCreateModalComponent } from './user-create-modal.component';
import { UserEditModalComponent } from './user-edit-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-users-list',
  imports: [ReactiveFormsModule, UserCreateModalComponent, UserEditModalComponent, ConfirmDeleteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-eyebrow">Gestión</div>
    <h1 class="page-title">Usuarios</h1>
    <p class="page-subtitle">Administrá los usuarios del sistema, sus roles y especialidades.</p>

    <div class="page-header-row" style="margin-bottom:16px">
      <div class="search-bar" style="flex:1;margin:0;margin-right:16px">
        <label for="users-search" class="visually-hidden">Buscar usuarios</label>
        <input id="users-search" type="search" [formControl]="searchControl" placeholder="Buscar por nombre o email..." />
      </div>
      <button type="button" class="btn-main" (click)="openCreate.set(true)">+ Nuevo usuario</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Email</th>
            <th scope="col">Roles</th>
            <th scope="col">Especialidades</th>
            <th scope="col">Ubicaciones</th>
            <th scope="col">Alta</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (u of paged(); track u.id) {
            <tr>
              <td>
                <div class="row-flex">
                  <span class="avatar" [style.background]="avatarBg(u)" [style.color]="avatarFg(u)">{{ initials(u) }}</span>
                  <span style="font-weight:600">{{ u.firstName }} {{ u.lastName }}</span>
                </div>
              </td>
              <td class="cell-muted">{{ u.email }}</td>
              <td>
                @for (r of rolesOf(u); track r.id) {
                  <span class="badge" [class]="'badge badge-' + r.color">{{ r.name }}</span>
                }
                @if (rolesOf(u).length === 0) { <span class="cell-muted">—</span> }
              </td>
              <td>
                @for (s of specsOf(u); track s.id) {
                  <span class="badge badge-blue">{{ s.name }}</span>
                }
                @if (specsOf(u).length === 0) { <span class="cell-muted">—</span> }
              </td>
              <td>
                @for (l of locsOf(u); track l.id) {
                  <span class="badge badge-gray">{{ l.name }}</span>
                }
                @if (locsOf(u).length === 0) { <span class="cell-muted">—</span> }
              </td>
              <td class="cell-id">{{ formatDate(u.createdAt) }}</td>
              <td>
                <div class="actions">
                  <button type="button" class="btn-outline" (click)="editing.set(u)">Editar</button>
                  <button type="button" class="btn-danger" (click)="deleting.set(u)">Eliminar</button>
                </div>
              </td>
            </tr>
          }
          @if (paged().length === 0) {
            <tr><td colspan="7" class="empty-state">No se encontraron usuarios.</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (totalPages() > 1) {
      <div class="pagination">
        <button type="button" class="pg-btn" [disabled]="page() === 1" (click)="prev()" aria-label="Página anterior">←</button>
        @for (n of pages(); track n) {
          <button type="button" class="pg-btn" [class.active]="page() === n" (click)="page.set(n)">{{ n }}</button>
        }
        <button type="button" class="pg-btn" [disabled]="page() === totalPages()" (click)="next()" aria-label="Página siguiente">→</button>
      </div>
    }

    <app-user-create-modal
      [open]="openCreate()"
      (close)="openCreate.set(false)"
      (created)="onCreated($event)"
    />

    <app-user-edit-modal
      [open]="editing() !== null"
      [user]="editing()"
      (close)="editing.set(null)"
      (updated)="onUpdated($event)"
    />

    <app-confirm-delete
      [open]="deleting() !== null"
      entityLabel="usuario"
      (cancel)="deleting.set(null)"
      (confirm)="confirmDelete()"
    />
  `,
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly roles = inject(RoleService);
  private readonly specs = inject(SpecialityService);
  private readonly locs = inject(LocationService);
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
    return this.users().filter(u => {
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
    this.userService.list().subscribe();
    this.roles.list().subscribe();
    this.specs.list().subscribe();
    this.locs.list().subscribe();
  }

  prev(): void { if (this.page() > 1) this.page.update(p => p - 1); }
  next(): void { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }

  rolesOf(u: User) {
    return this.roles.roles().filter(r => u.roleIds.includes(r.id));
  }
  specsOf(u: User) {
    return this.specs.specialities().filter(s => u.specialityIds.includes(s.id));
  }
  locsOf(u: User) {
    return this.locs.locations().filter(l => u.locationIds.includes(l.id));
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
