import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TypeSanction =
    | 'BLAME'
    | 'ABSENCE_JUSTIFIEE'
    | 'ABSENCE_NON_JUSTIFIEE'
    | 'RETARD'
    | 'RETENUE'
    | 'AVERTISSEMENT'
    | 'EXCLUSION_3J'
    | 'EXCLUSION_8J'
    | 'INTERPELLATION';

export const ALL_TYPES_SANCTION: TypeSanction[] = [
    'BLAME', 'ABSENCE_JUSTIFIEE', 'ABSENCE_NON_JUSTIFIEE', 'RETARD',
    'RETENUE', 'AVERTISSEMENT', 'EXCLUSION_3J', 'EXCLUSION_8J', 'INTERPELLATION'
];

export interface SanctionResponse {
    id: string;
    etablissementId: string;
    eleveId: string;
    eleveNom: string;
    elevePrenom: string;
    eleveMatricule: string;
    typeSanction: TypeSanction;
    dateSanction: string;
    motif: string;
    enregistreParId: string | null;
    genereParEscalade: boolean;
    anneeScolaire: string;
    dateCreation: string;
}

export interface SanctionRequest {
    eleveId: string;
    typeSanction: TypeSanction;
    dateSanction: string;
    motif: string;
    enregistreParId?: string;
}

export interface BonSortieResponse {
    id: string;
    etablissementId: string;
    eleveId: string;
    eleveNom: string;
    elevePrenom: string;
    eleveMatricule: string;
    dateSortie: string;
    motif: string;
    autoriseParId: string;
    statut: 'SORTI' | 'RENTRE';
    dateEntree: string | null;
    dateCreation: string;
}

export interface BonSortieRequest {
    eleveId: string;
    dateSortie: string;
    motif: string;
    autoriseParId: string;
}

export interface RegleDisciplineResponse {
    id: string;
    etablissementId: string;
    typeSanctionDeclencheur: TypeSanction;
    seuilDeclenchement: number;
    sanctionResultante: TypeSanction;
    dateCreation: string;
    dateModification: string | null;
}

export interface RegleDisciplineRequest {
    typeSanctionDeclencheur: TypeSanction;
    seuilDeclenchement: number;
    sanctionResultante: TypeSanction;
}

@Injectable({ providedIn: 'root' })
export class DisciplineService {
    private http = inject(HttpClient);

    // ── Sanctions ──────────────────────────────────────────────────────────────

    creerSanction(req: SanctionRequest): Observable<SanctionResponse> {
        return this.http.post<SanctionResponse>('/api/discipline/sanctions', req);
    }

    getSanctionsByEleve(eleveId: string): Observable<SanctionResponse[]> {
        return this.http.get<SanctionResponse[]>(`/api/discipline/sanctions/eleve/${eleveId}`);
    }

    getSanctionsByClasse(classeId: string): Observable<SanctionResponse[]> {
        return this.http.get<SanctionResponse[]>(`/api/discipline/sanctions/classe/${classeId}`);
    }

    // ── Bons de sortie ─────────────────────────────────────────────────────────

    creerBonSortie(req: BonSortieRequest): Observable<BonSortieResponse> {
        return this.http.post<BonSortieResponse>('/api/discipline/bons-sortie', req);
    }

    validerRetour(bonId: string): Observable<BonSortieResponse> {
        return this.http.put<BonSortieResponse>(`/api/discipline/bons-sortie/${bonId}/entree`, {});
    }

    getBonsSortieByEleve(eleveId: string): Observable<BonSortieResponse[]> {
        return this.http.get<BonSortieResponse[]>(`/api/discipline/bons-sortie/eleve/${eleveId}`);
    }

    // ── Règles d'escalade ──────────────────────────────────────────────────────

    getRegles(): Observable<RegleDisciplineResponse[]> {
        return this.http.get<RegleDisciplineResponse[]>('/api/discipline/regles');
    }

    creerRegle(req: RegleDisciplineRequest): Observable<RegleDisciplineResponse> {
        return this.http.post<RegleDisciplineResponse>('/api/discipline/regles', req);
    }

    modifierRegle(id: string, req: RegleDisciplineRequest): Observable<RegleDisciplineResponse> {
        return this.http.put<RegleDisciplineResponse>(`/api/discipline/regles/${id}`, req);
    }

    supprimerRegle(id: string): Observable<void> {
        return this.http.delete<void>(`/api/discipline/regles/${id}`);
    }
}
