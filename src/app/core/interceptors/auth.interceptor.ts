import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '@/app/core/services/auth.service';

// Verrou partagé : évite plusieurs appels /refresh simultanés si plusieurs
// requêtes reçoivent un 401 en même temps.
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    const outgoing = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next(outgoing).pipe(
        catchError((error) => {
            if (error instanceof HttpErrorResponse && error.status === 401 && !isRefreshing) {
                isRefreshing = true;
                return from(authService.refresh()).pipe(
                    switchMap((success) => {
                        isRefreshing = false;
                        if (!success) return throwError(() => error);
                        const fresh = authService.getToken();
                        const retried = fresh ? req.clone({ setHeaders: { Authorization: `Bearer ${fresh}` } }) : req;
                        return next(retried);
                    }),
                    catchError((refreshError) => {
                        isRefreshing = false;
                        return throwError(() => refreshError);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
