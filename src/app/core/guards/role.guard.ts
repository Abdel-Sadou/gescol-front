import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from '@/app/core/services/auth.service';

export const roleGuard = (allowed: Role[]): CanActivateFn => () => {
    const authService = inject(AuthService);
    const router      = inject(Router);
    const role        = authService.role();
    if (role && allowed.includes(role)) return true;
    // Utilisateur authentifié mais mauvais rôle → 403 (pas la page login)
    if (authService.isAuthenticated()) return router.createUrlTree(['/403']);
    return router.createUrlTree(['/connexion']);
};
