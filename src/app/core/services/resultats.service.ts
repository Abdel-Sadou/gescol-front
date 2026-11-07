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
    noteDp: number | null;
    noteDh: number | null;
    valeur: number | null;
    statut: StatutNote;
    saisieParId: string | null;
    dateCreation: string;
    dateModification: string | null;
}

export interface LigneNoteRequest {
    eleveId: string;
    noteDp?: number | null;
    noteDh?: number | null;
    valeur?: number | null;
}

export interface NoteLotRequest {
    matiereId: string;
    sequenceId: string;
    notes: LigneNoteRequest[];
}

// ─── Bulletin JSON (N°14) ──────────────────────────────────────────────────

export interface BulletinLigneDto {
    matiereLibelle: string;
    enseignantNom: string | null;
    dp: number | null;
    dh: number | null;
    moy: number | null;
    coef: number;
    total: number | null;
    rang: number | null;
    moyClasse: number | null;
    minClasse: number | null;
    maxClasse: number | null;
    appreciation: string | null;
}

export interface BulletinGroupeDto {
    groupeNum: number;
    totalPoints: number;
    totalPointsMax: number;
    totalCoef: number;
    moyenneGroupe: number | null;
    mention: string | null;
    lignes: BulletinLigneDto[];
}

export interface BulletinSequenceDto {
    eleveId: string;
    eleveNom: string;
    elevePrenom: string;
    eleveMatricule: string;
    dateNaissanceFormatee: string | null;
    lieuNaissance: string | null;
    classeLibelle: string;
    anneeScolaire: string;
    redoublant: boolean;
    effectifClasse: number;
    etablissementNom: string;
    sequenceLibelle: string;
    groupes: BulletinGroupeDto[];
    bandeScolaire: {
        totalPoints: number;
        totalPointsMax: number;
        totalCoef: number;
        average: number | null;
    };
    travail: {
        totalPoints: number;
        totalCoef: number;
        moyenne: number | null;
        rang: number | null;
        moyClasse: number | null;
        minClasse: number | null;
        maxClasse: number | null;
        mention: string | null;
    };
    discipline: {
        absencesInjustifiees: number;
        absencesJustifiees: number;
        retards: number;
        avertissements: number;
        blames: number;
        exclusions: number;
    };
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

export interface MoyenneTrimestreDetail {
    matiereId: string;
    matiereLibelle: string;
    noteS1: number | null;
    noteS2: number | null;
    noteTrimestre: number | null;
    coefficient: number;
}

export interface MoyenneTrimestreResponse {
    eleveId: string;
    trimestreId: string;
    trimestreLibelle: string;
    anneeScolaire: string;
    sequenceS1Libelle: string | null;
    sequenceS2Libelle: string | null;
    details: MoyenneTrimestreDetail[];
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

    getBulletinSequence(eleveId: string, sequenceId: string): Observable<BulletinSequenceDto> {
        return this.http.get<BulletinSequenceDto>(
            `/api/resultats/bulletins/${eleveId}/sequence/${sequenceId}`
        );
    }

    getBulletinPdf(eleveId: string, sequenceId: string): Observable<Blob> {
        return this.http.get(
            `/api/resultats/bulletins/${eleveId}/sequence/${sequenceId}/pdf`,
            { responseType: 'blob' }
        );
    }

    getMoyennesTrimestre(eleveId: string, trimestreId: string): Observable<MoyenneTrimestreResponse> {
        return this.http.get<MoyenneTrimestreResponse>(
            `/api/resultats/moyennes/eleve/${eleveId}/trimestre/${trimestreId}`
        );
    }

    getBulletinTrimestrePdf(eleveId: string, trimestreId: string): Observable<Blob> {
        return this.http.get(
            `/api/resultats/bulletins/${eleveId}/trimestre/${trimestreId}/pdf`,
            { responseType: 'blob' }
        );
    }
}
