import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePermissionPayload, Permission } from '../models/permission.model';

const SEED: Permission[] = [
  { id: 1, name: 'users:read' },
  { id: 2, name: 'users:write' },
  { id: 3, name: 'roles:manage' },
  { id: 4, name: 'patients:read' },
  { id: 5, name: 'patients:write' },
  { id: 6, name: 'appointments:write' },
  { id: 7, name: 'reports:view' },
];

const FAKE_DELAY_MS = 250;

@Injectable({ providedIn: 'root' })
export class PermissionService {
  readonly baseUrl = `${environment.apiBaseUrl}/permissions`;

  private readonly store = signal<Permission[]>(SEED);
  readonly permissions = this.store.asReadonly();

  list(): Observable<Permission[]> {
    return of(this.store()).pipe(delay(FAKE_DELAY_MS));
  }

  getById(id: number): Permission | undefined {
    return this.store().find(p => p.id === id);
  }

  create(payload: CreatePermissionPayload): Observable<Permission> {
    const nextId = this.store().reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const created: Permission = { id: nextId, name: payload.name };
    this.store.update(list => [...list, created]);
    return of(created).pipe(delay(FAKE_DELAY_MS));
  }

  update(id: number, payload: CreatePermissionPayload): Observable<Permission> {
    let updated!: Permission;
    this.store.update(list =>
      list.map(p => {
        if (p.id !== id) return p;
        updated = { ...p, name: payload.name };
        return updated;
      }),
    );
    return of(updated).pipe(delay(FAKE_DELAY_MS));
  }

  remove(id: number): Observable<void> {
    this.store.update(list => list.filter(p => p.id !== id));
    return of(undefined).pipe(delay(FAKE_DELAY_MS));
  }
}
