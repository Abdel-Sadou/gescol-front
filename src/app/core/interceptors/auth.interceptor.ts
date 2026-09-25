import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, from, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '@/app/core/services/auth.service';

// Verrou + file d'attente : les requêtes simultanées qui reçoivent un 401
// pendant qu'un refresh est déjà en cours attendent le nouveau token via
// refreshTokenSubject, puis sont rejouées automatiquement.
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

const addBearer = (r: Parameters<HttpInterceptorFn>[0], token: string) =>
    r.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    return next(token ? addBearer(req, token) : req).pipe(
        catchError((error) => {
            if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
                return throwError(() => error);
            }

            if (isRefreshing) {
                // Refresh déjà en cours : mettre en file d'attente et rejouer
                // dès que le nouveau token est disponible.
                return refreshTokenSubject.pipe(
                    filter((t): t is string => t !== null),
                    take(1),
                    switchMap(fresh => next(addBearer(req, fresh)))
                );
            }

            isRefreshing = true;
            refreshTokenSubject.next(null);

            return from(authService.refresh()).pipe(
                switchMap((success) => {
                    isRefreshing = false;
                    if (!success) return throwError(() => error);
                    const fresh = authService.getToken()!;
                    refreshTokenSubject.next(fresh);
                    return next(addBearer(req, fresh));
                }),
                catchError((refreshError) => {
                    isRefreshing = false;
                    refreshTokenSubject.next(null);
                    return throwError(() => refreshError);
                })
            );
        })
    );
};
