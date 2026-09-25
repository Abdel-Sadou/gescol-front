import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@/app/core/services/auth.service';

export const authGuard: CanActivateFn = async (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    if (authService.isAuthenticated()) return true;

    const refreshed = await authService.refresh();
    if (refreshed) return true;

    // Passer l'URL demandée pour rediriger l'utilisateur après connexion.
    return router.createUrlTree(['/connexion'], { queryParams: { returnUrl: state.url } });
};
