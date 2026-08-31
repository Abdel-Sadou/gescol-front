import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export type Role = 'SUPER_ADMIN' | 'SECRETARIAT' | 'ECONOMAT' | 'ENSEIGNANT' | 'PARENT' | 'COMMUNICATION';

export interface JwtPayload {
    sub: string;
    type: 'access' | 'refresh';
    roles: Role[];
    permissions: string[];
    utilisateurId: string;
    etablissementId: string;
    personnelId?: string;   // absent pour PARENT et les comptes sans fiche Personnel
    iat: number;
    exp: number;
}

export interface LoginCredentials {
    email: string;
    motDePasse: string;
}

interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType?: string;
    expiresIn?: number;
}

const TOKEN_KEY   = 'gescol_token';
const REFRESH_KEY = 'gescol_refresh';

// Compromis de sécurité documenté : localStorage expose le token aux scripts
// XSS. Acceptable ici car l'app est une SPA interne sans contenus tiers
// injectés. Alternative httpOnly cookie nécessiterait des modifications
// côté Spring Security (CSRF protection, SameSite) — à revoir si les
// exigences de sécurité évoluent.
@Injectable({ providedIn: 'root' })
export class AuthService {
    private http   = inject(HttpClient);
    private router = inject(Router);

    private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

    readonly isAuthenticated = computed(() => {
        const token = this._token();
        if (!token) return false;
        const payload = this.decode(token);
        return payload !== null && payload.exp * 1000 > Date.now();
    });

    readonly currentUser = computed<JwtPayload | null>(() => {
        const token = this._token();
        return token ? this.decode(token) : null;
    });

    readonly role = computed<Role | null>(() => this.currentUser()?.roles?.[0] ?? null);

    async login(credentials: LoginCredentials): Promise<void> {
        const res = await firstValueFrom(
            this.http.post<AuthResponse>('/api/auth/login', credentials)
        );
        this.storeTokens(res.accessToken, res.refreshToken);
    }

    async refresh(): Promise<boolean> {
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (!refreshToken) return false;
        try {
            const res = await firstValueFrom(
                this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken })
            );
            this.storeTokens(res.accessToken, res.refreshToken);
            return true;
        } catch {
            this.logout();
            return false;
        }
    }

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        this._token.set(null);
        this.router.navigate(['/connexion']);
    }

    getToken(): string | null {
        return this._token();
    }

    private storeTokens(token: string, refreshToken: string): void {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_KEY, refreshToken);
        this._token.set(token);
    }

    private decode(token: string): JwtPayload | null {
        try {
            const part    = token.split('.')[1];
            const decoded = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(decoded) as JwtPayload;
        } catch {
            return null;
        }
    }
}
