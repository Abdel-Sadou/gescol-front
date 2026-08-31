import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from '@/app/core/services/auth.service';

export const roleGuard = (allowed: Role[]): CanActivateFn => () => {
    const authService = inject(AuthService);
    const router      = inject(Router);
    const role        = authService.role();
    if (role && allowed.includes(role)) return true;
    return router.createUrlTree(['/connexion']);
};
