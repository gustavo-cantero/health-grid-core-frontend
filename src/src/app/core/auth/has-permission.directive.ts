import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Directiva estructural que renderiza su elemento solo cuando la sesión actual
 * tiene al menos uno de los permisos indicados.
 *
 *   <button *hgHasPermission="'users:create'">+ Nuevo usuario</button>
 *   <button *hgHasPermission="['users:write', 'users:delete']">…</button>
 */
@Directive({ selector: '[hgHasPermission]' })
export class HasPermissionDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  /** Un permiso o una lista; renderiza si el usuario tiene ALGUNO de ellos. */
  readonly hgHasPermission = input.required<string | string[]>();

  private visible = false;

  constructor() {
    effect(() => {
      const required = this.hgHasPermission();
      const list = Array.isArray(required) ? required : [required];
      const allowed = this.auth.hasAny(...list);
      if (allowed && !this.visible) {
        this.vcr.createEmbeddedView(this.tpl);
        this.visible = true;
      } else if (!allowed && this.visible) {
        this.vcr.clear();
        this.visible = false;
      }
    });
  }
}
