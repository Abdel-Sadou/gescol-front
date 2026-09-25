import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TypeContrat } from './personnel.service';

export type ModePaiementPaie = 'BILLETAGE' | 'VIREMENT_BANCAIRE';

export interface SpringPage<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    numberOfElements: number;
}

export interface BaremePaieResponse {
    id: string;
    etablissementId: string;
    typeContrat: TypeContrat;
    tauxIRPP: number;
    tauxCentimesAdditionnelsIRPP: number;
    montantTaxeCommunale: number;
    tauxCreditFoncierSalarial: number;
    tauxCreditFoncierPatronal: number;
    montantRedevanceAudiovisuelle: number;
    tauxFNE: number;
    tauxPensionVieillesseSalarial: number;
    tauxPensionVieillessePatronal: number;
    tauxAllocationsFamilialesPatronal: number;
    tauxAccidentTravailPatronal: number;
}

export interface BaremePaieRequest {
    typeContrat: TypeContrat;
    tauxIRPP: number;
    tauxCentimesAdditionnelsIRPP: number;
    montantTaxeCommunale: number;
    tauxCreditFoncierSalarial: number;
    tauxCreditFoncierPatronal: number;
    montantRedevanceAudiovisuelle: number;
    tauxFNE: number;
    tauxPensionVieillesseSalarial: number;
    tauxPensionVieillessePatronal: number;
    tauxAllocationsFamilialesPatronal: number;
    tauxAccidentTravailPatronal: number;
}

export interface LigneBulletin {
    type: string;
    libelle: string;
    taux: number | null;
    base: number | null;
    montant: number;
}

export interface BulletinPaieResponse {
    id: string;
    personnelId: string;
    personnelNom: string;
    personnelPrenom: string;
    personnelMatricule: string;
    periode: string;
    montantBrut: number;
    montantNet: number;
    datePaiement: string;
    modePaiement: ModePaiementPaie;
    lignes: LigneBulletin[];
    dateCreation: string;
}

export interface BulletinPaieRequest {
    personnelId: string;
    periode: string;
    heuresEffectuees?: number;
    tauxHoraire?: number;
    datePaiement: string;
    modePaiement: ModePaiementPaie;
}

@Injectable({ providedIn: 'root' })
export class PaieService {
    private http = inject(HttpClient);

    getBaremes(page = 0, size = 20): Observable<SpringPage<BaremePaieResponse>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<SpringPage<BaremePaieResponse>>('/api/paie/baremes', { params });
    }

    creerBareme(req: BaremePaieRequest): Observable<BaremePaieResponse> {
        return this.http.post<BaremePaieResponse>('/api/paie/baremes', req);
    }

    modifierBareme(id: string, req: BaremePaieRequest): Observable<BaremePaieResponse> {
        return this.http.put<BaremePaieResponse>(`/api/paie/baremes/${id}`, req);
    }

    supprimerBareme(id: string): Observable<void> {
        return this.http.delete<void>(`/api/paie/baremes/${id}`);
    }

    genererBulletin(req: BulletinPaieRequest): Observable<BulletinPaieResponse> {
        return this.http.post<BulletinPaieResponse>('/api/paie/bulletins/generer', req);
    }

    getBulletinsPersonnel(personnelId: string): Observable<BulletinPaieResponse[]> {
        return this.http.get<BulletinPaieResponse[]>(`/api/paie/bulletins/personnel/${personnelId}`);
    }

    downloadBulletinPdf(id: string): Observable<Blob> {
        return this.http.get(`/api/paie/bulletins/${id}/pdf`, { responseType: 'blob' });
    }

    downloadOrdreVirementPdf(id: string): Observable<Blob> {
        return this.http.get(`/api/paie/bulletins/${id}/ordre-virement/pdf`, { responseType: 'blob' });
    }
}
