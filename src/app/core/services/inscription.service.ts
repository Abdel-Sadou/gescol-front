import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CriteresInscriptionResponse {
    texteCriteres: string;
}

export interface ClasseDisponibleResponse {
    classeId: string;
    classeLibelle: string;
    sousSysteme: 'FRANCOPHONE' | 'ANGLOPHONE';
    montant: number;
    anneeScolaire: string;
}

export interface ModalitesPaiementResponse {
    tauxId: string;
    classeLibelle: string;
    montant: number;
    anneeScolaire: string;
}

export interface InscriptionResponse {
    id: string;
    eleveId: string;
    eleveNom: string;
    elevePrenom: string;
    classeId: string;
    classeLibelle: string;
    anneeScolaire: string;
    statut: 'RESERVEE' | 'CONFIRMEE' | 'ANNULEE';
    dateReservation: string;
    dateConfirmation: string | null;
}

export interface InformationsParentRequest {
    telephone?: string;
    localisation?: string;
    fonction?: string;
    email?: string;
}

@Injectable({ providedIn: 'root' })
export class InscriptionService {
    private http = inject(HttpClient);

    getCriteres(): Observable<CriteresInscriptionResponse> {
        return this.http.get<CriteresInscriptionResponse>('/api/parent/inscriptions/criteres');
    }

    getClassesDisponibles(): Observable<ClasseDisponibleResponse[]> {
        return this.http.get<ClasseDisponibleResponse[]>('/api/parent/inscriptions/classes-disponibles');
    }

    // classeId requis — obtenu via getClassesDisponibles().
    getModalitesPaiement(classeId: string): Observable<ModalitesPaiementResponse> {
        return this.http.get<ModalitesPaiementResponse>(
            `/api/parent/inscriptions/modalites-paiement/${classeId}`
        );
    }

    reserver(matricule: string, classeId: string): Observable<InscriptionResponse> {
        return this.http.post<InscriptionResponse>('/api/parent/inscriptions/reserver', { matricule, classeId });
    }

    majInformationsParent(
        inscriptionId: string,
        data: InformationsParentRequest
    ): Observable<InscriptionResponse> {
        return this.http.put<InscriptionResponse>(
            `/api/parent/inscriptions/${inscriptionId}/informations-parent`,
            data
        );
    }

    confirmer(inscriptionId: string): Observable<InscriptionResponse> {
        return this.http.post<InscriptionResponse>(
            `/api/parent/inscriptions/${inscriptionId}/confirmer`,
            {}
        );
    }

    getMesInscriptions(): Observable<InscriptionResponse[]> {
        return this.http.get<InscriptionResponse[]>('/api/parent/mes-inscriptions');
    }

    // Blob — JWT dans le header Authorization, jamais dans l'URL (cohérent avec downloadQuittancePdf).
    getLettreEngagementPdf(inscriptionId: string): Observable<Blob> {
        return this.http.get(
            `/api/parent/inscriptions/${inscriptionId}/lettre-engagement/pdf`,
            { responseType: 'blob' }
        );
    }
}
