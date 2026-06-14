import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap, throwError, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateLocationPayload, Location } from '../models/location.model';
import { ApiLocation, PaginatedResponse } from '../models/api.model';
import { toError } from '../utils/api-error';

const PAGE_SIZE = 1000;

function fromApi(l: ApiLocation): Location {
  return { id: l.id, name: l.name, address: l.address, city: l.city, country: l.country };
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = `${environment.apiBaseUrl}/locations`;

  private readonly store = signal<Location[]>([]);
  readonly locations = this.store.asReadonly();

  list(): Observable<Location[]> {
    const params = new HttpParams().set('page', 1).set('pageSize', PAGE_SIZE);
    return this.http.get<PaginatedResponse<ApiLocation>>(this.baseUrl, { params }).pipe(
      map(res => res.data.map(fromApi)),
      tap(items => this.store.set(items)),
      catchError(err => throwError(() => toError(err))),
    );
  }

  getById(id: number): Location | undefined {
    return this.store().find(l => l.id === id);
  }

  create(payload: CreateLocationPayload): Observable<Location> {
    return this.http.post<ApiLocation>(this.baseUrl, payload).pipe(
      map(fromApi),
      tap(created => this.store.update(list => [...list, created])),
      catchError(err => throwError(() => toError(err))),
    );
  }

  update(id: number, payload: CreateLocationPayload): Observable<Location> {
    return this.http.put<ApiLocation>(`${this.baseUrl}/${id}`, payload).pipe(
      map(fromApi),
      tap(updated => this.store.update(list => list.map(l => (l.id === id ? updated : l)))),
      catchError(err => throwError(() => toError(err))),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined),
      tap(() => this.store.update(list => list.filter(l => l.id !== id))),
      catchError(err => throwError(() => toError(err))),
    );
  }
}
