import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CORE_MODULES, PERMISSIONS } from '../../core/auth/permissions';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';
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
  /** Callback SSO del módulo, cuando vive en otro dominio. Sin esto, no está disponible. */
  ssoUrl?: string;
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
  private readonly toast = inject(ToastService);
  private readonly document = inject(DOCUMENT);

  /** Label del módulo cuyo ticket SSO se está pidiendo, o null si no hay ninguno. */
  protected readonly ssoPending = signal<string | null>(null);

  protected readonly coreOpen = signal<boolean>(true);
  protected readonly userMenuOpen = signal<boolean>(false);
  protected readonly profileOpen = signal<boolean>(false);
  protected readonly changePasswordOpen = signal<boolean>(false);

  protected readonly userName = computed(() => this.auth.currentUser()?.name ?? 'Invitado');
  protected readonly userRole = computed(() => this.auth.currentUser()?.role ?? '—');
  protected readonly initials = computed(() => this.auth.currentUser()?.initials ?? 'GA');

  protected readonly modules: readonly ModuleEntry[] = [
    { label: 'Historia Clínica', icon: 'file-text', ssoUrl: environment.medicalRecordsSsoUrl },
    { label: 'Turnos y Agendas', icon: 'calendar', ssoUrl: environment.appointmentsSsoUrl },
    { label: 'Farmacia e Insumos', icon: 'package' },
    { label: 'Laboratorio', icon: 'activity' },
    { label: 'Diagnóstico por Imágenes', icon: 'image' },
    { label: 'Internación y Camas', icon: 'home' },
    { label: 'Facturación', icon: 'credit-card' },
    { label: 'Portal del Paciente', icon: 'user', ssoUrl: environment.patientPortalSsoUrl },
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

  /**
   * Abre un módulo de otro dominio con la sesión ya iniciada: pide al core un
   * ticket SSO de un solo uso y redirige al callback del módulo con el ticket
   * en la query. Allá se canjea por un JWT propio, así que el usuario no vuelve
   * a loguearse.
   *
   * El ticket vive ~60 s: se pide recién al hacer clic y se navega enseguida.
   * La navegación es en la misma pestaña (no `window.open`) para que un bloqueo
   * de popups no deje el ticket sin usar.
   */
  openModuleSso(m: ModuleEntry): void {
    if (!m.ssoUrl || this.ssoPending() !== null) return;

    this.ssoPending.set(m.label);
    this.auth.issueSsoTicket().subscribe({
      next: (ticket) => {
        this.document.location.href = `${m.ssoUrl}?ticket=${encodeURIComponent(ticket)}`;
      },
      error: (err: Error) => {
        this.ssoPending.set(null);
        this.toast.show(err.message || `No se pudo abrir ${m.label}.`);
      },
    });
  }

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
