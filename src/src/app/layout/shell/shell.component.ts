import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastComponent } from '../../shared/ui/toast/toast.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <app-sidebar />
      <div class="main">
        <div class="content">
          <router-outlet />
        </div>
      </div>
    </div>
    <app-toast />
  `,
})
export class ShellComponent {}
