import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the Bearer token to every request aimed at our API (relative URLs in
 * dev — proxied — or the configured absolute base URL in prod) and, on a 401,
 * clears the session and redirects to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token();
  const authReq =
    token && isApiUrl(req.url)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthEndpoint(req.url)) {
        auth.clearSession();
        void router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};

function isApiUrl(url: string): boolean {
  // Relative URLs (dev, via proxy) or absolute URLs to our own API.
  return url.startsWith('/') || url.startsWith('http');
}

function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/');
}
