import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '@/app/core/services/eleve.service';

export type TypePersonnel = 'ENSEIGNANT' | 'NON_ENSEIGNANT';
export type TypeContrat   = 'VACATAIRE' | 'SEMI_PERMANENT' | 'PERMANENT';

export interface PersonnelResponse {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    typePersonnel: TypePersonnel;
    typeContrat: TypeContrat;
    fonction: string | null;
    telephone: string | null;
    email: string | null;
    dateEmbauche: string | null;
    actif: boolean;
    salaireBase: number | null;
    indemniteTransport: number | null;
    numeroCompteBancaire: string | null;
    nomBanque: string | null;
    matiereIds: string[];
    etablissementId: string;
    dateCreation: string;
    dateModification: string | null;
}

export interface PersonnelRequest {
    nom: string;
    prenom: string;
    typePersonnel: TypePersonnel;
    typeContrat: TypeContrat;
    fonction?: string;
    telephone?: string;
    email?: string;
    dateEmbauche?: string;
    salaireBase?: number;
    indemniteTransport?: number;
    numeroCompteBancaire?: string;
    nomBanque?: string;
    actif?: boolean;
    matiereIds?: string[];
}

export interface PersonnelSearchParams {
    nom?: string;
    matricule?: string;
    typePersonnel?: TypePersonnel;
}

@Injectable({ providedIn: 'root' })
export class PersonnelService {
    private http = inject(HttpClient);

    rechercher(
        params: PersonnelSearchParams = {},
        page = 0, size = 20, sort = 'nom,asc'
    ): Observable<PageResponse<PersonnelResponse>> {
        let p = new HttpParams().set('page', page).set('size', size).set('sort', sort);
        if (params.nom)           p = p.set('nom', params.nom);
        if (params.matricule)     p = p.set('matricule', params.matricule);
        if (params.typePersonnel) p = p.set('typePersonnel', params.typePersonnel);
        return this.http.get<PageResponse<PersonnelResponse>>('/api/personnel', { params: p });
    }

    getById(id: string): Observable<PersonnelResponse> {
        return this.http.get<PersonnelResponse>(`/api/personnel/${id}`);
    }

    creer(req: PersonnelRequest): Observable<PersonnelResponse> {
        return this.http.post<PersonnelResponse>('/api/personnel', req);
    }

    modifier(id: string, req: PersonnelRequest): Observable<PersonnelResponse> {
        return this.http.put<PersonnelResponse>(`/api/personnel/${id}`, req);
    }

    supprimer(id: string): Observable<void> {
        return this.http.delete<void>(`/api/personnel/${id}`);
    }

    desactiver(id: string): Observable<PersonnelResponse> {
        return this.http.put<PersonnelResponse>(`/api/personnel/${id}/desactiver`, {});
    }

    reactiver(id: string): Observable<PersonnelResponse> {
        return this.http.put<PersonnelResponse>(`/api/personnel/${id}/reactiver`, {});
    }

    listerSansCompte(): Observable<PersonnelResponse[]> {
        return this.http.get<PersonnelResponse[]>('/api/personnel/sans-compte');
    }
}
