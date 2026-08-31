import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EnfantResponse {
    eleveId: string;
    nom: string;
    prenom: string;
    matricule: string;
    classeLibelle: string;
}

export interface SoldeResponse {
    eleveId: string;
    anneeScolaire: string;
    tauxScolarite: number;
    totalVerse: number;
    soldeRestant: number;
}

export interface MoyenneDetailResponse {
    matiereId: string;
    matiereLibelle: string;
    note: number | null;
    coefficient: number;
}

export interface MoyenneResponse {
    eleveId: string;
    sequenceId: string;
    details: MoyenneDetailResponse[];
    moyenneGenerale: number | null;
}

export interface SanctionResponse {
    id: string;
    eleveId: string;
    eleveNom: string;
    elevePrenom: string;
    eleveMatricule: string;
    typeSanction: string;
    dateSanction: string;
    motif: string;
    enregistreParId: string | null;
    genereParEscalade: boolean;
    anneeScolaire: string;
    dateCreation: string;
}

export interface SuiviEleveResponse {
    eleveId: string;
    eleveNom: string;
    elevePrenom: string;
    solde: SoldeResponse;
    sequenceId: string;
    sequenceLibelle: string;
    sequenceCourante: boolean;
    moyennes: MoyenneResponse;
    sanctions: SanctionResponse[];
}

export interface VersementResponse {
    id: string;
    eleveId: string;
    eleveNom: string;
    elevePrenom: string;
    eleveMatricule: string;
    montant: number;
    dateVersement: string;
    numeroQuittance: string;
    anneeScolaire: string;
    soldeApresVersement: number;
    modePaiement: 'CAISSE' | 'VALIDATION_BANCAIRE';
    numeroRecuBancaire: string | null;
    nomSignataireBancaire: string | null;
    creeParId: string | null;
    dateCreation: string;
    statutValidation: 'VALIDE' | 'EN_ATTENTE_VALIDATION' | 'REJETE';
    declareParId: string | null;
    valideParId: string | null;
    dateValidation: string | null;
    motifRejet: string | null;
}

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ParentDashboardService {
    private http = inject(HttpClient);

    getMesEnfants(): Observable<EnfantResponse[]> {
        return this.http.get<EnfantResponse[]>('/api/parent/mes-enfants');
    }

    // R16 : la vérification que l'élève appartient au parent courant est faite côté backend (403 si violation)
    getSuivi(eleveId: string): Observable<SuiviEleveResponse> {
        return this.http.get<SuiviEleveResponse>(`/api/parent/eleves/${eleveId}/suivi`);
    }

    getHistoriqueVersements(eleveId: string): Observable<PageResponse<VersementResponse>> {
        return this.http.get<PageResponse<VersementResponse>>(`/api/finances/versements/eleve/${eleveId}`);
    }

    // responseType blob — ne jamais exposer le token JWT dans une URL query param (ADR implicite sécurité)
    downloadQuittancePdf(versementId: string): Observable<Blob> {
        return this.http.get(`/api/finances/quittances/${versementId}/pdf`, { responseType: 'blob' });
    }
}
