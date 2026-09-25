import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export type StatutNote = 'BROUILLON' | 'VALIDEE';

export interface NoteResponse {
    id: string;
    eleveId: string;
    eleveNom: string;
    elevePrenom: string;
    eleveMatricule: string;
    matiereId: string;
    matiereLibelle: string;
    sequenceId: string;
    sequenceLibelle: string;
    valeur: number | null;
    statut: StatutNote;
    saisieParId: string | null;
    dateCreation: string;
    dateModification: string | null;
}

export interface NoteLotRequest {
    matiereId: string;
    sequenceId: string;
    notes: { eleveId: string; valeur: number }[];
}

export interface ValiderNotesRequest {
    noteIds: string[];
}

export interface MoyenneDetail {
    matiereId: string;
    matiereLibelle: string;
    note: number | null;
    coefficient: number;
}

export interface MoyennesResponse {
    eleveId: string;
    sequenceId: string;
    details: MoyenneDetail[];
    moyenneGenerale: number | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ResultatsService {
    private http = inject(HttpClient);

    getNotesByClasseMatiereSequence(
        classeId: string,
        matiereId: string,
        sequenceId: string
    ): Observable<NoteResponse[]> {
        return this.http.get<NoteResponse[]>(
            `/api/resultats/notes/classe/${classeId}/matiere/${matiereId}/sequence/${sequenceId}`
        );
    }

    saisirEnLot(req: NoteLotRequest): Observable<NoteResponse[]> {
        return this.http.post<NoteResponse[]>('/api/resultats/notes/lot', req);
    }

    validerNotes(req: ValiderNotesRequest): Observable<void> {
        return this.http.put<void>('/api/resultats/notes/valider', req);
    }

    getMoyennesEleve(eleveId: string, sequenceId: string): Observable<MoyennesResponse> {
        return this.http.get<MoyennesResponse>(
            `/api/resultats/moyennes/eleve/${eleveId}/sequence/${sequenceId}`
        );
    }

    getBulletinPdf(eleveId: string, sequenceId: string): Observable<Blob> {
        return this.http.get(
            `/api/resultats/bulletins/${eleveId}/sequence/${sequenceId}/pdf`,
            { responseType: 'blob' }
        );
    }
}
