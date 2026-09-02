import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface EleveResponse {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    sexe: 'M' | 'F';
    dateNaissance: string;
    lieuNaissance: string | null;
    classeId: string;
    classeLibelle: string;
    redoublant: boolean;
    sousSysteme: 'FRANCOPHONE' | 'ANGLOPHONE' | null;
    apteSport: boolean;
    groupeSanguin: string | null;
    nomPere: string | null;
    nomMere: string | null;
    quartier: string | null;
    personneContact: string | null;
    telephoneContact: string | null;
    etablissementId: string;
    dateCreation: string;
    dateModification: string | null;
}

export interface EleveRequest {
    nom: string;
    prenom: string;
    sexe: 'M' | 'F';
    dateNaissance: string;      // ISO-8601 YYYY-MM-DD
    lieuNaissance?: string;
    classeId: string;
    redoublant?: boolean;
    sousSysteme?: 'FRANCOPHONE' | 'ANGLOPHONE';
    apteSport?: boolean;
    groupeSanguin?: string;
    nomPere?: string;
    nomMere?: string;
    quartier?: string;
    personneContact?: string;
    telephoneContact?: string;
}

export interface EleveSearchParams {
    nom?: string;
    prenom?: string;
    matricule?: string;
    classeLibelle?: string;
}

@Injectable({ providedIn: 'root' })
export class EleveService {
    private http = inject(HttpClient);

    rechercher(
        params: EleveSearchParams = {},
        page = 0,
        size = 20,
        sort = 'nom,asc'
    ): Observable<PageResponse<EleveResponse>> {
        let p = new HttpParams()
            .set('page', String(page))
            .set('size', String(size))
            .set('sort', sort);
        if (params.nom)          p = p.set('nom', params.nom);
        if (params.prenom)       p = p.set('prenom', params.prenom);
        if (params.matricule)    p = p.set('matricule', params.matricule);
        if (params.classeLibelle) p = p.set('classeLibelle', params.classeLibelle);
        return this.http.get<PageResponse<EleveResponse>>('/api/eleves', { params: p });
    }

    getById(id: string): Observable<EleveResponse> {
        return this.http.get<EleveResponse>(`/api/eleves/${id}`);
    }

    creer(data: EleveRequest): Observable<EleveResponse> {
        return this.http.post<EleveResponse>('/api/eleves', data);
    }

    modifier(id: string, data: EleveRequest): Observable<EleveResponse> {
        return this.http.put<EleveResponse>(`/api/eleves/${id}`, data);
    }

    supprimer(id: string): Observable<void> {
        return this.http.delete<void>(`/api/eleves/${id}`);
    }
}
