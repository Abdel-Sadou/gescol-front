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

export interface MembreEquipePedagogiqueResponse {
    id: string;
    nom: string;
    fonction: string;
    photoUrl: string | null;
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
}
