import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, tap, throwError, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRolePayload, Role, RoleColor } from '../models/role.model';
import { ApiRole, PaginatedResponse } from '../models/api.model';
import { toError } from '../utils/api-error';

const PAGE_SIZE = 1000;

// The API has no notion of a role color; derive one deterministically so badges
// stay stable across reloads.
const COLOR_PALETTE: RoleColor[] = ['green', 'blue', 'amber', 'red', 'teal', 'dark', 'gray'];

function colorForId(id: number): RoleColor {
  return COLOR_PALETTE[id % COLOR_PALETTE.length];
}

function fromApi(apiRole: ApiRole): Role {
  return {
    id: apiRole.id,
    name: apiRole.name,
    color: colorForId(apiRole.id),
    permissionIds: (apiRole.permissions ?? []).map(p => p.id),
  };
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = `${environment.apiBaseUrl}/roles`;

  private readonly store = signal<Role[]>([]);
  readonly roles = this.store.asReadonly();

  list(): Observable<Role[]> {
    const params = new HttpParams().set('page', 1).set('pageSize', PAGE_SIZE);
    return this.http.get<PaginatedResponse<ApiRole>>(this.baseUrl, { params }).pipe(
      map(res => res.data.map(fromApi)),
      tap(roles => this.store.set(roles)),
      catchError(err => throwError(() => toError(err))),
    );
  }

  getById(id: number): Role | undefined {
    return this.store().find(r => r.id === id);
  }

  // Pide el detalle del rol a la API y refresca la copia cacheada.
  get(id: number): Observable<Role> {
    return this.http.get<ApiRole>(`${this.baseUrl}/${id}`).pipe(
      map(fromApi),
      tap(role => this.store.update(list => list.map(r => (r.id === id ? role : r)))),
      catchError(err => throwError(() => toError(err))),
    );
  }

  create(payload: CreateRolePayload): Observable<Role> {
    return this.http.post<ApiRole>(this.baseUrl, { name: payload.name }).pipe(
      map(fromApi),
      tap(created => this.store.update(list => [...list, created])),
      catchError(err => throwError(() => toError(err))),
    );
  }

  update(id: number, patch: Partial<Pick<Role, 'name' | 'color' | 'permissionIds'>>): Observable<Role> {
    const current = this.getById(id);
    const calls: Observable<unknown>[] = [];

    if (patch.name !== undefined) {
      calls.push(this.http.put<ApiRole>(`${this.baseUrl}/${id}`, { name: patch.name }));
    }
    if (patch.permissionIds !== undefined) {
      this.collectPermissionCalls(calls, id, current?.permissionIds ?? [], patch.permissionIds);
    }

    const ops$: Observable<unknown> = calls.length ? forkJoin(calls) : of(null);
    return ops$.pipe(
      switchMap(() => this.http.get<ApiRole>(`${this.baseUrl}/${id}`)),
      map(fromApi),
      tap(updated => this.store.update(list => list.map(r => (r.id === id ? updated : r)))),
      catchError(err => throwError(() => toError(err))),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined),
      tap(() => this.store.update(list => list.filter(r => r.id !== id))),
      catchError(err => throwError(() => toError(err))),
    );
  }

  saveMatrix(matrix: Record<number, number[]>): Observable<void> {
    const calls: Observable<unknown>[] = [];
    for (const [roleIdStr, nextIds] of Object.entries(matrix)) {
      const roleId = Number(roleIdStr);
      const current = this.getById(roleId);
      this.collectPermissionCalls(calls, roleId, current?.permissionIds ?? [], nextIds);
    }
    const ops$: Observable<unknown> = calls.length ? forkJoin(calls) : of(null);
    return ops$.pipe(
      switchMap(() => this.list()),
      map(() => undefined),
      catchError(err => throwError(() => toError(err))),
    );
  }

  private collectPermissionCalls(
    calls: Observable<unknown>[],
    roleId: number,
    currentIds: number[],
    nextIds: number[],
  ): void {
    for (const permId of nextIds.filter(v => !currentIds.includes(v))) {
      calls.push(this.http.post(`${this.baseUrl}/${roleId}/permissions`, { permission_id: permId }));
    }
    for (const permId of currentIds.filter(v => !nextIds.includes(v))) {
      calls.push(this.http.delete(`${this.baseUrl}/${roleId}/permissions/${permId}`));
    }
  }
}
