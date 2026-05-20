import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRolePayload, Role, RoleColor } from '../models/role.model';

const SEED: Role[] = [
  { id: 1, name: 'Admin', color: 'dark', permissionIds: [1, 2, 3, 4, 5, 6, 7] },
  { id: 2, name: 'Médico', color: 'green', permissionIds: [4, 5, 6, 7] },
  { id: 3, name: 'Recepcionista', color: 'amber', permissionIds: [4, 6] },
  { id: 4, name: 'Paciente', color: 'teal', permissionIds: [] },
];

const FAKE_DELAY_MS = 250;

@Injectable({ providedIn: 'root' })
export class RoleService {
  readonly baseUrl = `${environment.apiBaseUrl}/roles`;

  private readonly store = signal<Role[]>(SEED);
  readonly roles = this.store.asReadonly();

  list(): Observable<Role[]> {
    return of(this.store()).pipe(delay(FAKE_DELAY_MS));
  }

  getById(id: number): Role | undefined {
    return this.store().find(r => r.id === id);
  }

  create(payload: CreateRolePayload): Observable<Role> {
    const nextId = this.store().reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const color: RoleColor = payload.color ?? 'gray';
    const created: Role = { id: nextId, name: payload.name, color, permissionIds: [] };
    this.store.update(list => [...list, created]);
    return of(created).pipe(delay(FAKE_DELAY_MS));
  }

  update(id: number, patch: Partial<Pick<Role, 'name' | 'color' | 'permissionIds'>>): Observable<Role> {
    let updated!: Role;
    this.store.update(list =>
      list.map(r => {
        if (r.id !== id) return r;
        updated = { ...r, ...patch };
        return updated;
      }),
    );
    return of(updated).pipe(delay(FAKE_DELAY_MS));
  }

  remove(id: number): Observable<void> {
    this.store.update(list => list.filter(r => r.id !== id));
    return of(undefined).pipe(delay(FAKE_DELAY_MS));
  }

  saveMatrix(matrix: Record<number, number[]>): Observable<void> {
    this.store.update(list =>
      list.map(r => (matrix[r.id] ? { ...r, permissionIds: [...matrix[r.id]] } : r)),
    );
    return of(undefined).pipe(delay(FAKE_DELAY_MS));
  }
}
