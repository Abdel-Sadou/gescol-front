import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from './eleve.service';

export type StatutVersement = 'VALIDE' | 'EN_ATTENTE_VALIDATION' | 'REJETE';
export type ModePaiement    = 'CAISSE' | 'VALIDATION_BANCAIRE';
export type StatutMoratoire = 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';

// ── Versements ─────────────────────────────────────────────────────────────────

export interface VersementRequest {
    eleveId: string;
    montant: number;
    modePaiement?: ModePaiement;
    numeroRecuBancaire?: string;
    nomSignataireBancaire?: string;
}

export interface RejeterVersementRequest { motifRejet: string; }

export interface VersementResponse {
    id: string;
    etablissementId: string;
    eleveId: string;
    eleveNom: string;
    elevePrenom: string;
    eleveMatricule: string;
    montant: number;
    dateVersement: string;
    numeroQuittance: string;
    anneeScolaire: string;
    soldeApresVersement: number;
    modePaiement: ModePaiement;
    numeroRecuBancaire: string | null;
    nomSignataireBancaire: string | null;
    creeParId: string | null;
    dateCreation: string;
    statutValidation: StatutVersement;
    declareParId: string | null;
    valideParId: string | null;
    dateValidation: string | null;
    motifRejet: string | null;
}

export interface SoldeResponse {
    eleveId: string;
    anneeScolaire: string;
    tauxScolarite: number;
    totalVerse: number;
    soldeRestant: number;
}

// ── Moratoires ─────────────────────────────────────────────────────────────────

export interface MoratoireRequest {
    eleveId: string;
    dateProposee: string;   // LocalDate ISO YYYY-MM-DD
    motif?: string;
}

export interface MoratoireResponse {
    id: string;
    eleveId: string;
    eleveNom: string;
    elevePrenom: string;
    eleveMatricule: string;
    eleveRedoublant: boolean;
    dateDemande: string;
    dateProposee: string;
    motif: string | null;
    statut: StatutMoratoire;
    demandeParId: string | null;
    valideParId: string | null;
    dateDecision: string | null;
}

// ── Alertes ────────────────────────────────────────────────────────────────────

export interface EleveEnRetardResponse {
    eleveId: string;
    nom: string;
    prenom: string;
    matricule: string;
    classeLibelle: string;
    soldeRestant: number;
}

// ── États ──────────────────────────────────────────────────────────────────────

export interface VersementsClasseResponse {
    eleveId: string;
    nom: string;
    prenom: string;
    matricule: string;
    montantScolarite: number;
    totalVerse: number;
    soldeRestant: number;
}

export interface TotauxResponse {
    dateDebut: string;
    dateFin: string;
    totalVerse: number;
    nombreVersements: number;
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FinancesService {
    private http = inject(HttpClient);

    // -- Versements --

    creerVersement(req: VersementRequest): Observable<VersementResponse> {
        return this.http.post<VersementResponse>('/api/finances/versements', req);
    }

    getVersementsEleve(eleveId: string, page = 0, size = 20): Observable<PageResponse<VersementResponse>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<VersementResponse>>(`/api/finances/versements/eleve/${eleveId}`, { params });
    }

    getSolde(eleveId: string): Observable<SoldeResponse> {
        return this.http.get<SoldeResponse>(`/api/finances/eleves/${eleveId}/solde`);
    }

    getVersementsEnAttente(): Observable<VersementResponse[]> {
        return this.http.get<VersementResponse[]>('/api/finances/versements/en-attente-validation');
    }

    validerVersement(id: string): Observable<VersementResponse> {
        return this.http.put<VersementResponse>(`/api/finances/versements/${id}/valider`, {});
    }

    rejeterVersement(id: string, req: RejeterVersementRequest): Observable<VersementResponse> {
        return this.http.put<VersementResponse>(`/api/finances/versements/${id}/rejeter`, req);
    }

    // -- Quittance PDF --

    downloadQuittancePdf(versementId: string): Observable<Blob> {
        return this.http.get(`/api/finances/quittances/${versementId}/pdf`, { responseType: 'blob' });
    }

    // -- Moratoires --

    creerMoratoire(req: MoratoireRequest): Observable<MoratoireResponse> {
        return this.http.post<MoratoireResponse>('/api/finances/moratoires', req);
    }

    getMoratoriesEnAttente(): Observable<MoratoireResponse[]> {
        return this.http.get<MoratoireResponse[]>('/api/finances/moratoires/en-attente');
    }

    validerMoratoire(id: string): Observable<MoratoireResponse> {
        return this.http.patch<MoratoireResponse>(`/api/finances/moratoires/${id}/valider`, null);
    }

    refuserMoratoire(id: string): Observable<MoratoireResponse> {
        return this.http.patch<MoratoireResponse>(`/api/finances/moratoires/${id}/refuser`, null);
    }

    getHistoriqueMoratoires(statut?: StatutMoratoire): Observable<MoratoireResponse[]> {
        let params = new HttpParams();
        if (statut) params = params.set('statut', statut);
        return this.http.get<MoratoireResponse[]>('/api/finances/moratoires/historique', { params });
    }

    // -- Alertes --

    getElevesEnRetard(): Observable<EleveEnRetardResponse[]> {
        return this.http.get<EleveEnRetardResponse[]>('/api/finances/alertes/retards');
    }

    declencherAlertes(): Observable<{ notificationsEnvoyees: number }> {
        return this.http.post<{ notificationsEnvoyees: number }>('/api/finances/alertes/declencher', {});
    }

    getSeuil(): Observable<{ nombreJoursAvantAlerte: number }> {
        return this.http.get<{ nombreJoursAvantAlerte: number }>('/api/finances/alertes/seuil');
    }

    setSeuil(nombreJoursAvantAlerte: number): Observable<{ nombreJoursAvantAlerte: number }> {
        return this.http.put<{ nombreJoursAvantAlerte: number }>('/api/finances/alertes/seuil', { nombreJoursAvantAlerte });
    }

    // -- États --

    getVersementsClasse(classeId: string, anneeScolaire?: string): Observable<VersementsClasseResponse[]> {
        let params = new HttpParams();
        if (anneeScolaire) params = params.set('anneeScolaire', anneeScolaire);
        return this.http.get<VersementsClasseResponse[]>(`/api/finances/etats/classe/${classeId}/versements`, { params });
    }

    getTotaux(dateDebut: string, dateFin: string): Observable<TotauxResponse> {
        const params = new HttpParams().set('dateDebut', dateDebut).set('dateFin', dateFin);
        return this.http.get<TotauxResponse>('/api/finances/etats/totaux', { params });
    }
}
