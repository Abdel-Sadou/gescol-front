import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '@/app/core/services/eleve.service';

// ── Types partagés ────────────────────────────────────────────────────────────

export type SousSysteme = 'FRANCOPHONE' | 'ANGLOPHONE';

// Niveaux
export interface NiveauResponse {
    id: string; libelle: string; sousSysteme: SousSysteme; ordre: number;
    etablissementId: string; dateCreation: string; dateModification: string | null;
}
export interface NiveauRequest { libelle: string; sousSysteme: SousSysteme; ordre: number; }

// Classes
export interface ClasseResponse {
    id: string; libelle: string; sousSysteme: SousSysteme;
    niveauId: string | null; niveauLibelle: string | null;
    anneeScolaire: string; etablissementId: string;
    professeurPrincipalId: string | null;
    dateCreation: string; dateModification: string | null;
}
export interface ClasseRequest { libelle: string; sousSysteme: SousSysteme; niveauId?: string; anneeScolaire: string; }
export interface ProfesseurPrincipalRequest { personnelId: string; }

// Trimestres
export interface TrimestreResponse {
    id: string; libelle: string; anneeScolaire: string;
    dateDebut: string; dateFin: string;
    etablissementId: string; dateCreation: string; dateModification: string | null;
}
export interface TrimestreRequest { libelle: string; anneeScolaire: string; dateDebut: string; dateFin: string; }

// Séquences
export interface SequenceResponse {
    id: string; libelle: string; trimestreId: string; trimestreLibelle: string;
    dateDebut: string; dateFin: string;
    etablissementId: string; dateCreation: string; dateModification: string | null;
}
export interface SequenceRequest { libelle: string; trimestreId: string; dateDebut: string; dateFin: string; }

// Taux de scolarité
export interface TauxScolariteResponse {
    id: string; classeId: string; classeLibelle: string;
    montant: number; anneeScolaire: string;
    etablissementId: string; dateCreation: string; dateModification: string | null;
}
export interface TauxScolariteRequest { classeId: string; montant: number; anneeScolaire: string; }

// Quotas horaires
export interface QuotaHoraireResponse {
    id: string; matiereId: string; matiereLibelle: string;
    classeId: string; classeLibelle: string;
    heuresParSemaine: number;
    etablissementId: string; dateCreation: string; dateModification: string | null;
}
export interface QuotaHoraireRequest { matiereId: string; classeId: string; heuresParSemaine: number; }

// Matières
export interface MatiereResponse {
    id: string; libelle: string; sousSysteme: SousSysteme;
    etablissementId: string; dateCreation: string; dateModification: string | null;
}
export interface MatiereRequest { libelle: string; sousSysteme: SousSysteme; }

// Coefficients
export interface CoefficientResponse {
    id: string; matiereId: string; matiereLibelle: string;
    classeId: string; classeLibelle: string;
    valeur: number;
    etablissementId: string; dateCreation: string; dateModification: string | null;
}
export interface CoefficientRequest { matiereId: string; classeId: string; valeur: number; }

// Modèles de lettre d'engagement
export interface ModeleLettreEngagementResponse {
    id: string; libelle: string; contenu: string;
    etablissementId: string; dateCreation: string; dateModification: string | null;
}
export interface ModeleLettreEngagementRequest { libelle: string; contenu: string; }

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ParametrageService {
    private http = inject(HttpClient);

    // Niveaux
    getNiveaux(page = 0, size = 20, sort = 'ordre,asc'): Observable<PageResponse<NiveauResponse>> {
        const p = new HttpParams().set('page', page).set('size', size).set('sort', sort);
        return this.http.get<PageResponse<NiveauResponse>>('/api/niveaux', { params: p });
    }
    creerNiveau(req: NiveauRequest): Observable<NiveauResponse> {
        return this.http.post<NiveauResponse>('/api/niveaux', req);
    }
    modifierNiveau(id: string, req: NiveauRequest): Observable<NiveauResponse> {
        return this.http.put<NiveauResponse>(`/api/niveaux/${id}`, req);
    }
    supprimerNiveau(id: string): Observable<void> {
        return this.http.delete<void>(`/api/niveaux/${id}`);
    }

    // Classes
    getClasses(page = 0, size = 20, sort = 'libelle,asc'): Observable<PageResponse<ClasseResponse>> {
        const p = new HttpParams().set('page', page).set('size', size).set('sort', sort);
        return this.http.get<PageResponse<ClasseResponse>>('/api/classes', { params: p });
    }
    creerClasse(req: ClasseRequest): Observable<ClasseResponse> {
        return this.http.post<ClasseResponse>('/api/classes', req);
    }
    modifierClasse(id: string, req: ClasseRequest): Observable<ClasseResponse> {
        return this.http.put<ClasseResponse>(`/api/classes/${id}`, req);
    }
    supprimerClasse(id: string): Observable<void> {
        return this.http.delete<void>(`/api/classes/${id}`);
    }
    designerProfesseurPrincipal(id: string, req: ProfesseurPrincipalRequest): Observable<ClasseResponse> {
        return this.http.put<ClasseResponse>(`/api/classes/${id}/professeur-principal`, req);
    }

    // Trimestres
    getTrimestres(page = 0, size = 20, sort = 'dateDebut,asc'): Observable<PageResponse<TrimestreResponse>> {
        const p = new HttpParams().set('page', page).set('size', size).set('sort', sort);
        return this.http.get<PageResponse<TrimestreResponse>>('/api/trimestres', { params: p });
    }
    creerTrimestre(req: TrimestreRequest): Observable<TrimestreResponse> {
        return this.http.post<TrimestreResponse>('/api/trimestres', req);
    }
    modifierTrimestre(id: string, req: TrimestreRequest): Observable<TrimestreResponse> {
        return this.http.put<TrimestreResponse>(`/api/trimestres/${id}`, req);
    }
    supprimerTrimestre(id: string): Observable<void> {
        return this.http.delete<void>(`/api/trimestres/${id}`);
    }

    // Séquences — pas de filtre côté serveur, on charge tout et filtre côté client par trimestreId
    getSequences(page = 0, size = 200, sort = 'dateDebut,asc'): Observable<PageResponse<SequenceResponse>> {
        const p = new HttpParams().set('page', page).set('size', size).set('sort', sort);
        return this.http.get<PageResponse<SequenceResponse>>('/api/sequences', { params: p });
    }
    creerSequence(req: SequenceRequest): Observable<SequenceResponse> {
        return this.http.post<SequenceResponse>('/api/sequences', req);
    }
    modifierSequence(id: string, req: SequenceRequest): Observable<SequenceResponse> {
        return this.http.put<SequenceResponse>(`/api/sequences/${id}`, req);
    }
    supprimerSequence(id: string): Observable<void> {
        return this.http.delete<void>(`/api/sequences/${id}`);
    }

    // Taux de scolarité
    getTauxScolarite(page = 0, size = 20, sort = 'anneeScolaire,desc'): Observable<PageResponse<TauxScolariteResponse>> {
        const p = new HttpParams().set('page', page).set('size', size).set('sort', sort);
        return this.http.get<PageResponse<TauxScolariteResponse>>('/api/taux-scolarite', { params: p });
    }
    creerTaux(req: TauxScolariteRequest): Observable<TauxScolariteResponse> {
        return this.http.post<TauxScolariteResponse>('/api/taux-scolarite', req);
    }
    modifierTaux(id: string, req: TauxScolariteRequest): Observable<TauxScolariteResponse> {
        return this.http.put<TauxScolariteResponse>(`/api/taux-scolarite/${id}`, req);
    }
    supprimerTaux(id: string): Observable<void> {
        return this.http.delete<void>(`/api/taux-scolarite/${id}`);
    }

    // Quotas horaires
    getQuotasHoraires(page = 0, size = 20, sort = 'heuresParSemaine,asc'): Observable<PageResponse<QuotaHoraireResponse>> {
        const p = new HttpParams().set('page', page).set('size', size).set('sort', sort);
        return this.http.get<PageResponse<QuotaHoraireResponse>>('/api/quotas-horaires', { params: p });
    }
    creerQuota(req: QuotaHoraireRequest): Observable<QuotaHoraireResponse> {
        return this.http.post<QuotaHoraireResponse>('/api/quotas-horaires', req);
    }
    modifierQuota(id: string, req: QuotaHoraireRequest): Observable<QuotaHoraireResponse> {
        return this.http.put<QuotaHoraireResponse>(`/api/quotas-horaires/${id}`, req);
    }
    supprimerQuota(id: string): Observable<void> {
        return this.http.delete<void>(`/api/quotas-horaires/${id}`);
    }

    // Matières
    getMatieres(page = 0, size = 20, sort = 'libelle,asc'): Observable<PageResponse<MatiereResponse>> {
        const p = new HttpParams().set('page', page).set('size', size).set('sort', sort);
        return this.http.get<PageResponse<MatiereResponse>>('/api/matieres', { params: p });
    }
    creerMatiere(req: MatiereRequest): Observable<MatiereResponse> {
        return this.http.post<MatiereResponse>('/api/matieres', req);
    }
    modifierMatiere(id: string, req: MatiereRequest): Observable<MatiereResponse> {
        return this.http.put<MatiereResponse>(`/api/matieres/${id}`, req);
    }
    supprimerMatiere(id: string): Observable<void> {
        return this.http.delete<void>(`/api/matieres/${id}`);
    }

    // Coefficients
    getCoefficients(page = 0, size = 20, sort = 'valeur,asc'): Observable<PageResponse<CoefficientResponse>> {
        const p = new HttpParams().set('page', page).set('size', size).set('sort', sort);
        return this.http.get<PageResponse<CoefficientResponse>>('/api/coefficients', { params: p });
    }
    creerCoefficient(req: CoefficientRequest): Observable<CoefficientResponse> {
        return this.http.post<CoefficientResponse>('/api/coefficients', req);
    }
    modifierCoefficient(id: string, req: CoefficientRequest): Observable<CoefficientResponse> {
        return this.http.put<CoefficientResponse>(`/api/coefficients/${id}`, req);
    }
    supprimerCoefficient(id: string): Observable<void> {
        return this.http.delete<void>(`/api/coefficients/${id}`);
    }

    // Modèles de lettre d'engagement
    getModelesEngagement(page = 0, size = 20): Observable<PageResponse<ModeleLettreEngagementResponse>> {
        const p = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<ModeleLettreEngagementResponse>>('/api/modeles-engagement', { params: p });
    }
    getModeleById(id: string): Observable<ModeleLettreEngagementResponse> {
        return this.http.get<ModeleLettreEngagementResponse>(`/api/modeles-engagement/${id}`);
    }
    creerModele(req: ModeleLettreEngagementRequest): Observable<ModeleLettreEngagementResponse> {
        return this.http.post<ModeleLettreEngagementResponse>('/api/modeles-engagement', req);
    }
    modifierModele(id: string, req: ModeleLettreEngagementRequest): Observable<ModeleLettreEngagementResponse> {
        return this.http.put<ModeleLettreEngagementResponse>(`/api/modeles-engagement/${id}`, req);
    }
    supprimerModele(id: string): Observable<void> {
        return this.http.delete<void>(`/api/modeles-engagement/${id}`);
    }
}
