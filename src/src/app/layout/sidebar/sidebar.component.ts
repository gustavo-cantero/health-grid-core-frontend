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
  badge: string;
}

interface CoreSubItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ProfileEditModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocClick($event)',
  },
  template: `
    <aside class="sidebar" aria-label="Navegación principal">
      <div class="sidebar-logo">
        <div class="logo-row">
          <span class="logo-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </span>
          <div>
            <div class="logo-text">Health Grid</div>
            <div class="logo-sub">HG Core Admin</div>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">MÓDULOS</div>

        @for (m of modules; track m.label; let idx = $index) {
          <button
            type="button"
            class="nav-item"
            disabled
            aria-disabled="true"
            title="Módulo no disponible en este mockup"
          >
            <span class="nav-icon" aria-hidden="true">
              @switch (m.icon) {
                @case ('file-text')   { <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
                @case ('calendar')    { <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
                @case ('package')     { <svg viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg> }
                @case ('activity')    { <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
                @case ('image')       { <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
                @case ('home')        { <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
                @case ('credit-card') { <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> }
                @case ('user')        { <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
                @case ('bar-chart')   { <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
              }
            </span>
            <span class="nav-label">{{ m.label }}</span>
            <span class="nav-module">{{ idx + 1 }}</span>
          </button>
        }

        <button
          type="button"
          class="nav-item"
          [class.core-active]="coreOpen()"
          [attr.aria-expanded]="coreOpen()"
          aria-controls="core-submenu"
          (click)="toggleCore()"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </span>
          <span class="nav-label">Core</span>
          <span class="nav-module">10</span>
          <span class="nav-icon" [class.rotate]="coreOpen()" aria-hidden="true">
            <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </span>
        </button>

        <div id="core-submenu" class="nav-submenu" [class.open]="coreOpen()">
          @for (item of coreItems; track item.path) {
            <a
              class="nav-subitem"
              [routerLink]="item.path"
              routerLinkActive="active"
            >{{ item.label }}</a>
          }
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-dropdown" [class.open]="userMenuOpen()">
          <button type="button" (click)="onEditProfile()">Editar mis datos</button>
          <button type="button" (click)="onLogout()">Cerrar sesión</button>
        </div>
        <button
          type="button"
          class="user-card"
          [attr.aria-expanded]="userMenuOpen()"
          aria-controls="user-dropdown"
          (click)="toggleUserMenu($event)"
        >
          <span class="user-avatar" aria-hidden="true">{{ initials() }}</span>
          <span style="flex:1;min-width:0">
            <span class="user-name" style="display:block">{{ userName() }}</span>
            <span class="user-role">{{ userRole() }}</span>
          </span>
          <span class="user-chevron" [class.rotate]="userMenuOpen()" aria-hidden="true">
            <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </span>
        </button>
      </div>
    </aside>

    <app-profile-edit-modal
      [open]="profileOpen()"
      (close)="profileOpen.set(false)"
    />
  `,
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
    { label: 'Historia Clínica',         icon: 'file-text',   badge: '1' },
    { label: 'Turnos y Agendas',         icon: 'calendar',    badge: '2' },
    { label: 'Farmacia e Insumos',       icon: 'package',     badge: '3' },
    { label: 'Laboratorio',              icon: 'activity',    badge: '4' },
    { label: 'Diagnóstico por Imágenes', icon: 'image',       badge: '5' },
    { label: 'Internación y Camas',      icon: 'home',        badge: '6' },
    { label: 'Facturación',              icon: 'credit-card', badge: '7' },
    { label: 'Portal del Paciente',      icon: 'user',        badge: '8' },
    { label: 'Monitoreo',                icon: 'bar-chart',   badge: '9' },
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
