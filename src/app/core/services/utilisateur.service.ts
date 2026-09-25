import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '@/app/core/services/eleve.service';

// Rôles assignables via /api/utilisateurs — PARENT explicitement exclu (API retourne 400).
export type RoleStaff =
    | 'SUPER_ADMIN'
    | 'SECRETARIAT'
    | 'ECONOMAT'
    | 'ENSEIGNANT'
    | 'COMMUNICATION';

export interface UtilisateurRequest {
    email: string;
    nom?: string;
    prenom?: string;
    roles: RoleStaff[];
    personnelId?: string;
}

export interface UtilisateurResponse {
    id: string;
    email: string;
    nom: string;
    prenom: string | null;
    roles: RoleStaff[];
    actif: boolean;
    personnelId: string | null;
    personnelNom: string | null;
    personnelPrenom: string | null;
    dateCreation: string;
}

// Présent UNIQUEMENT dans la réponse 201 — jamais stocké durablement.
export interface UtilisateurCreatedResponse extends UtilisateurResponse {
    motDePasseTemporaire: string;
}

export interface UtilisateurFilterParams {
    actif?: boolean;
    role?: RoleStaff;
}

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
    private http = inject(HttpClient);

    lister(
        params: UtilisateurFilterParams = {},
        page = 0,
        size = 20,
        sort = 'nom,asc'
    ): Observable<PageResponse<UtilisateurResponse>> {
        let p = new HttpParams().set('page', page).set('size', size).set('sort', sort);
        if (params.actif !== undefined) p = p.set('actif', params.actif);
        if (params.role)               p = p.set('role', params.role);
        return this.http.get<PageResponse<UtilisateurResponse>>('/api/utilisateurs', { params: p });
    }

    creer(req: UtilisateurRequest): Observable<UtilisateurCreatedResponse> {
        return this.http.post<UtilisateurCreatedResponse>('/api/utilisateurs', req);
    }

    modifierRoles(id: string, roles: RoleStaff[]): Observable<UtilisateurResponse> {
        return this.http.put<UtilisateurResponse>(`/api/utilisateurs/${id}/roles`, { roles });
    }

    reinitialiserMotDePasse(id: string): Observable<{ motDePasseTemporaire: string }> {
        return this.http.put<{ motDePasseTemporaire: string }>(
            `/api/utilisateurs/${id}/reinitialiser-mot-de-passe`,
            {}
        );
    }

    desactiver(id: string): Observable<void> {
        return this.http.put<void>(`/api/utilisateurs/${id}/desactiver`, {});
    }

    reactiver(id: string): Observable<void> {
        return this.http.put<void>(`/api/utilisateurs/${id}/reactiver`, {});
    }
}
