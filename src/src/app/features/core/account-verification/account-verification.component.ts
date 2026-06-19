import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast.service';

interface UserInvite {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  status: 'Pendiente' | 'Verificada' | 'Expirada';
  tokenPreview: string;
}

@Component({
  selector: 'app-account-verification',
  imports: [ReactiveFormsModule],
  templateUrl: './account-verification.component.html',
  styleUrls: ['./account-verification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountVerificationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly sending = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['Sofia', Validators.required],
    lastName: ['Mendez', Validators.required],
    email: ['sofia.mendez@healthgrid.com', [Validators.required, Validators.email]],
    role: ['Administrativo', Validators.required],
  });

  protected readonly roles = [
    'Admin',
    'Medico',
    'Enfermero',
    'Administrativo',
    'Bioquimico',
    'Paciente',
  ];

  protected readonly invites = signal<UserInvite[]>([
    {
      id: 1,
      name: 'Sofia Mendez',
      email: 'sofia.mendez@healthgrid.com',
      role: 'Administrativo',
      createdAt: '19/06/2026 12:25',
      expiresAt: '21/06/2026 12:25',
      status: 'Pendiente',
      tokenPreview: '8f7a...bca2',
    },
    {
      id: 2,
      name: 'Claudio Perez',
      email: 'claudio.perez@healthgrid.com',
      role: 'Admin',
      createdAt: '18/06/2026 16:40',
      expiresAt: '20/06/2026 16:40',
      status: 'Verificada',
      tokenPreview: '54c1...1d90',
    },
  ]);

  createInvite(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.sending.set(true);

    window.setTimeout(() => {
      const next: UserInvite = {
        id: Date.now(),
        name: `${value.firstName} ${value.lastName}`,
        email: value.email,
        role: value.role,
        createdAt: '19/06/2026 14:45',
        expiresAt: '21/06/2026 14:45',
        status: 'Pendiente',
        tokenPreview: '3b18...9af0',
      };
      this.invites.update((items) => [next, ...items]);
      this.sending.set(false);
      this.toast.show('Usuario creado e invitacion enviada');
    }, 450);
  }

  resendInvite(invite: UserInvite): void {
    this.toast.show(`Se reenvio la invitacion a ${invite.email}`);
  }
}
