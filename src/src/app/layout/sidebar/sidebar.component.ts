import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CORE_MODULES, PERMISSIONS } from '../../core/auth/permissions';
import { ProfileEditModalComponent } from '../profile-edit-modal/profile-edit-modal.component';
import { ChangePasswordModalComponent } from '../change-password-modal/change-password-modal.component';

type ModuleIcon =
  | 'file-text'
  | 'calendar'
  | 'package'
  | 'activity'
  | 'image'
  | 'home'
  | 'credit-card'
  | 'user'
  | 'bar-chart';

interface ModuleEntry {
  label: string;
  icon: ModuleIcon;
}

interface CoreSubItem {
  label: string;
  path: string;
  read: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ProfileEditModalComponent, ChangePasswordModalComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocClick($event)',
  },
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly coreOpen = signal<boolean>(true);
  protected readonly userMenuOpen = signal<boolean>(false);
  protected readonly profileOpen = signal<boolean>(false);
  protected readonly changePasswordOpen = signal<boolean>(false);

  protected readonly userName = computed(() => this.auth.currentUser()?.name ?? 'Invitado');
  protected readonly userRole = computed(() => this.auth.currentUser()?.role ?? '—');
  protected readonly initials = computed(() => this.auth.currentUser()?.initials ?? 'GA');

  protected readonly modules: readonly ModuleEntry[] = [
    { label: 'Historia Clínica', icon: 'file-text' },
    { label: 'Turnos y Agendas', icon: 'calendar' },
    { label: 'Farmacia e Insumos', icon: 'package' },
    { label: 'Laboratorio', icon: 'activity' },
    { label: 'Diagnóstico por Imágenes', icon: 'image' },
    { label: 'Internación y Camas', icon: 'home' },
    { label: 'Facturación', icon: 'credit-card' },
    { label: 'Portal del Paciente', icon: 'user' },
    { label: 'Monitoreo', icon: 'bar-chart' },
  ];

  // Solo se muestran los módulos para los que el usuario tiene permiso de lectura.
  protected readonly coreItems = computed<CoreSubItem[]>(() =>
    CORE_MODULES.filter((m) => this.auth.has(m.read)).map((m) => ({
      label: m.label,
      path: m.path,
      read: m.read,
    })),
  );

  // "Cambiar contraseña" solo si el usuario puede cambiar la propia.
  protected readonly canChangePassword = computed(() =>
    this.auth.has(PERMISSIONS.users.passwordSelf),
  );

  toggleCore(): void {
    this.coreOpen.update((v) => !v);
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen.update((v) => !v);
  }

  onDocClick(event: MouseEvent): void {
    if (!this.userMenuOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.userMenuOpen.set(false);
    }
  }

  onEditProfile(): void {
    this.userMenuOpen.set(false);
    this.profileOpen.set(true);
  }

  onChangePassword(): void {
    this.userMenuOpen.set(false);
    this.changePasswordOpen.set(true);
  }

  onLogout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
