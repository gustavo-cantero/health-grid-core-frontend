import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileEditModalComponent } from '../profile-edit-modal/profile-edit-modal.component';

type ModuleIcon =
  | 'file-text' | 'calendar' | 'package' | 'activity'
  | 'image' | 'home' | 'credit-card' | 'user' | 'bar-chart';

interface ModuleEntry {
  label: string;
  icon: ModuleIcon;
}

interface CoreSubItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ProfileEditModalComponent],
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

  protected readonly userName = computed(() => this.auth.currentUser()?.name ?? 'Invitado');
  protected readonly userRole = computed(() => this.auth.currentUser()?.role ?? '—');
  protected readonly initials = computed(() => this.auth.currentUser()?.initials ?? 'GA');

  protected readonly modules: readonly ModuleEntry[] = [
    { label: 'Historia Clínica',         icon: 'file-text'   },
    { label: 'Turnos y Agendas',         icon: 'calendar'    },
    { label: 'Farmacia e Insumos',       icon: 'package'     },
    { label: 'Laboratorio',              icon: 'activity'    },
    { label: 'Diagnóstico por Imágenes', icon: 'image'       },
    { label: 'Internación y Camas',      icon: 'home'        },
    { label: 'Facturación',              icon: 'credit-card' },
    { label: 'Portal del Paciente',      icon: 'user'        },
    { label: 'Monitoreo',                icon: 'bar-chart'   },
  ];

  protected readonly coreItems: readonly CoreSubItem[] = [
    { label: 'Usuarios',       path: '/core/users' },
    { label: 'Roles',          path: '/core/roles' },
    { label: 'Permisos',       path: '/core/permissions' },
    { label: 'Especialidades', path: '/core/specialities' },
    { label: 'Ubicaciones',    path: '/core/locations' },
  ];

  toggleCore(): void {
    this.coreOpen.update(v => !v);
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen.update(v => !v);
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

  onLogout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
