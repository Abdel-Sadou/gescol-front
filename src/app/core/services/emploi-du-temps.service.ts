import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type JourSemaine =
    'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface EmploiDuTempsResponse {
    id: string;
    etablissementId: string;
    classeId: string;
    classeLibelle: string;
    matiereId: string;
    matiereLibelle: string;
    enseignantId: string;
    enseignantNom: string;
    enseignantPrenom: string;
    jourSemaine: JourSemaine;
    heureDebut: string;   // "HH:mm:ss"
    heureFin: string;     // "HH:mm:ss"
    anneeScolaire: string;
}

export interface EmploiDuTempsRequest {
    classeId: string;
    matiereId: string;
    enseignantId: string;
    jourSemaine: JourSemaine;
    heureDebut: string;   // "HH:mm:ss"
    heureFin: string;     // "HH:mm:ss"
    anneeScolaire: string;
}

@Injectable({ providedIn: 'root' })
export class EmploiDuTempsService {
    private http = inject(HttpClient);

    getByClasse(classeId: string): Observable<EmploiDuTempsResponse[]> {
        return this.http.get<EmploiDuTempsResponse[]>(`/api/emplois-du-temps/classe/${classeId}`);
    }

    getByEnseignant(enseignantId: string): Observable<EmploiDuTempsResponse[]> {
        return this.http.get<EmploiDuTempsResponse[]>(`/api/emplois-du-temps/enseignant/${enseignantId}`);
    }

    creerCreneau(req: EmploiDuTempsRequest): Observable<EmploiDuTempsResponse> {
        return this.http.post<EmploiDuTempsResponse>('/api/emplois-du-temps', req);
    }

    supprimerCreneau(id: string): Observable<void> {
        return this.http.delete<void>(`/api/emplois-du-temps/${id}`);
    }
}
