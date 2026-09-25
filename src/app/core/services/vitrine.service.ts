import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContenuVitrineResponse {
    id: string;
    cle: string;
    contenu: string | null;
    fichierUrl: string | null;
    dateCreation: string;
    dateModification: string | null;
}

export interface ContenuVitrineRequest {
    contenu?: string;
    fichierUrl?: string;
}

export interface ActualiteResponse {
    id: string;
    titre: string;
    contenu: string;
    datePublication: string;  // ISO date "YYYY-MM-DD"
    imageUrl: string | null;
    publie: boolean;
    dateCreation: string;
    dateModification: string | null;
}

export interface ActualiteRequest {
    titre: string;
    contenu: string;
    datePublication: string;  // "YYYY-MM-DD"
    imageUrl?: string;
    publie?: boolean;
}

export interface EvenementCalendrierResponse {
    id: string;
    libelle: string;
    description: string | null;
    dateDebut: string;       // LocalDate "YYYY-MM-DD"
    dateFin: string | null;  // null = événement d'un seul jour
}

export interface EvenementCalendrierRequest {
    libelle: string;
    description?: string;
    dateDebut: string;  // "YYYY-MM-DD"
    dateFin?: string;
}

export interface MembreEquipePedagogiqueResponse {
    id: string;
    nom: string;
    fonction: string;
    photoUrl: string | null;
    ordre: number;
}

export interface MembreEquipePedagogiqueRequest {
    nom: string;
    fonction: string;
    photoUrl?: string;
    ordre: number;
}

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class VitrineService {
    private http = inject(HttpClient);

    // ── Public (vitrine côté visiteur) ─────────────────────────────────────

    getContenu(cle: string): Observable<ContenuVitrineResponse> {
        return this.http.get<ContenuVitrineResponse>(`/api/vitrine/contenu/${cle}`);
    }

    getActualites(page = 0, size = 6): Observable<PageResponse<ActualiteResponse>> {
        return this.http.get<PageResponse<ActualiteResponse>>('/api/vitrine/actualites', {
            params: { page: page.toString(), size: size.toString() }
        });
    }

    // 404 = inexistant OU dépublié (indistinguable côté frontend, cf. API_CONTRACT.md)
    getActualiteById(id: string): Observable<ActualiteResponse> {
        return this.http.get<ActualiteResponse>(`/api/vitrine/actualites/${id}`);
    }

    getEquipePedagogique(): Observable<MembreEquipePedagogiqueResponse[]> {
        return this.http.get<MembreEquipePedagogiqueResponse[]>('/api/vitrine/equipe-pedagogique');
    }

    getCalendrier(): Observable<EvenementCalendrierResponse[]> {
        return this.http.get<EvenementCalendrierResponse[]>('/api/vitrine/calendrier');
    }

    // ── Admin — Contenu paramétrable (SUPER_ADMIN, COMMUNICATION) ──────────

    majContenu(cle: string, req: ContenuVitrineRequest): Observable<ContenuVitrineResponse> {
        return this.http.put<ContenuVitrineResponse>(`/api/vitrine/contenu/${cle}`, req);
    }

    // ── Admin — Actualités (SUPER_ADMIN, COMMUNICATION) ────────────────────

    // Utilise le même endpoint public + JWT en header (ajouté par l'intercepteur).
    // La visibilité des éléments dépubliés (publie=false) dépend du backend.
    getActualitesAdmin(page = 0, size = 50): Observable<PageResponse<ActualiteResponse>> {
        return this.http.get<PageResponse<ActualiteResponse>>('/api/vitrine/actualites', {
            params: { page: page.toString(), size: size.toString() }
        });
    }

    creerActualite(req: ActualiteRequest): Observable<ActualiteResponse> {
        return this.http.post<ActualiteResponse>('/api/vitrine/actualites', req);
    }

    modifierActualite(id: string, req: ActualiteRequest): Observable<ActualiteResponse> {
        return this.http.put<ActualiteResponse>(`/api/vitrine/actualites/${id}`, req);
    }

    supprimerActualite(id: string): Observable<void> {
        return this.http.delete<void>(`/api/vitrine/actualites/${id}`);
    }

    // ── Admin — Calendrier (SUPER_ADMIN, COMMUNICATION) ────────────────────

    creerEvenement(req: EvenementCalendrierRequest): Observable<EvenementCalendrierResponse> {
        return this.http.post<EvenementCalendrierResponse>('/api/vitrine/calendrier', req);
    }

    modifierEvenement(id: string, req: EvenementCalendrierRequest): Observable<EvenementCalendrierResponse> {
        return this.http.put<EvenementCalendrierResponse>(`/api/vitrine/calendrier/${id}`, req);
    }

    supprimerEvenement(id: string): Observable<void> {
        return this.http.delete<void>(`/api/vitrine/calendrier/${id}`);
    }

    // ── Admin — Équipe pédagogique (SUPER_ADMIN, COMMUNICATION) ───────────

    creerMembreEquipe(req: MembreEquipePedagogiqueRequest): Observable<MembreEquipePedagogiqueResponse> {
        return this.http.post<MembreEquipePedagogiqueResponse>('/api/vitrine/equipe-pedagogique', req);
    }

    modifierMembreEquipe(id: string, req: MembreEquipePedagogiqueRequest): Observable<MembreEquipePedagogiqueResponse> {
        return this.http.put<MembreEquipePedagogiqueResponse>(`/api/vitrine/equipe-pedagogique/${id}`, req);
    }

    supprimerMembreEquipe(id: string): Observable<void> {
        return this.http.delete<void>(`/api/vitrine/equipe-pedagogique/${id}`);
    }
}
