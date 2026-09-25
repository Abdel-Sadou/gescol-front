import {
    ChangeDetectionStrategy, Component, EventEmitter,
    inject, Input, OnInit, Output, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';
import { ParametrageService, ClasseResponse, MatiereResponse, SequenceResponse } from '@/app/core/services/parametrage.service';
import { EmploiDuTempsService } from '@/app/core/services/emploi-du-temps.service';
import { AuthService } from '@/app/core/services/auth.service';

// ─── Types exports ────────────────────────────────────────────────────────────

export interface SelecteurResult {
    classeId: string;
    classeLibelle: string;
    matiereId: string;
    matiereLibelle: string;
    sequenceId: string;
    sequenceLibelle: string;
}

type Opt = { label: string; value: string };

// ─── Composant ───────────────────────────────────────────────────────────────

@Component({
    selector: 'note-selecteur',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, TranslocoDirective, SelectModule],
    styles: [`
        :host { display: block; }
        .ns-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
        .ns-field { display: flex; flex-direction: column; gap: 5px; flex: 1 1 180px; }
        .ns-label { font-size: 12px; font-weight: 600; color: var(--color-text); }
        .ns-empty {
            background: var(--color-surface-alt); border: 1px solid var(--color-border);
            border-radius: var(--radius-md); padding: 14px 16px;
            font-size: 13px; color: var(--color-text-muted);
            display: flex; align-items: center; gap: 10px;
        }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        @if (showEmptyProfPrincipal()) {
            <div class="ns-empty">
                <i class="pi pi-info-circle" style="color:var(--color-primary)"></i>
                {{ t('resultats.selecteur.aucuneClasseProfPrincipal') }}
            </div>
        } @else {
            <div class="ns-row">

                <!-- 1. Séquence — toujours disponible (repère temporel, point de départ naturel) -->
                <div class="ns-field">
                    <label class="ns-label">{{ t('resultats.selecteur.sequence') }}</label>
                    <p-select
                        [ngModel]="selectedSequenceId()"
                        (ngModelChange)="onSequenceChange($event)"
                        [options]="sequenceOptions()"
                        optionLabel="label" optionValue="value"
                        [showClear]="true"
                        [placeholder]="t('resultats.selecteur.choisirSequence')"
                        [loading]="loadingSequences()">
                    </p-select>
                </div>

                <!-- 2. Classe — toujours disponible (indépendant de la séquence) -->
                <div class="ns-field">
                    <label class="ns-label">{{ t('resultats.selecteur.classe') }}</label>
                    <p-select
                        [ngModel]="selectedClasseId()"
                        (ngModelChange)="onClasseChange($event)"
                        [options]="classeOptions()"
                        optionLabel="label" optionValue="value"
                        [showClear]="true"
                        [filter]="classeOptions().length > 8"
                        [placeholder]="t('resultats.selecteur.choisirClasse')"
                        [loading]="loadingClasses()">
                    </p-select>
                </div>

                <!-- 3. Matière — débloquée quand une classe est choisie -->
                <div class="ns-field">
                    <label class="ns-label">{{ t('resultats.selecteur.matiere') }}</label>
                    <p-select
                        [ngModel]="selectedMatiereId()"
                        (ngModelChange)="onMatiereChange($event)"
                        [options]="matiereOptions()"
                        optionLabel="label" optionValue="value"
                        [showClear]="true"
                        [filter]="matiereOptions().length > 8"
                        [disabled]="!selectedClasseId()"
                        [placeholder]="t('resultats.selecteur.choisirMatiere')"
                        [loading]="loadingMatieres()">
                    </p-select>
                </div>

            </div>
        }
    </ng-container>
    `
})
export class NoteSelecteur implements OnInit {
    @Input() mode: 'saisie' | 'validation' = 'saisie';
    @Output() selectionChange = new EventEmitter<SelecteurResult | null>();

    private authService  = inject(AuthService);
    private paramService = inject(ParametrageService);
    private edtService   = inject(EmploiDuTempsService);

    readonly loadingClasses   = signal(false);
    readonly loadingMatieres  = signal(false);
    readonly loadingSequences = signal(false);

    readonly classeOptions   = signal<Opt[]>([]);
    readonly matiereOptions  = signal<Opt[]>([]);
    readonly sequenceOptions = signal<Opt[]>([]);

    readonly selectedClasseId   = signal<string | null>(null);
    readonly selectedMatiereId  = signal<string | null>(null);
    readonly selectedSequenceId = signal<string | null>(null);

    readonly showEmptyProfPrincipal = signal(false);

    private allClasses:   ClasseResponse[]   = [];
    private allMatieres:  MatiereResponse[]  = [];
    private allSequences: SequenceResponse[] = [];
    private enseignantPairs: { classeId: string; classeLibelle: string; matiereId: string; matiereLibelle: string }[] = [];

    private isEnseignant = false;
    private personnelId  = '';

    ngOnInit(): void {
        const user = this.authService.currentUser();
        this.isEnseignant = this.authService.role() === 'ENSEIGNANT';
        this.personnelId  = user?.personnelId ?? '';

        this.loadSequences();

        if (this.isEnseignant) {
            if (this.mode === 'saisie') {
                this.loadEnseignantClasses();
            } else {
                this.loadProfPrincipalClasses();
            }
        } else {
            this.loadAllClasses();
            this.loadAllMatieres();
        }
    }

    // ── Loaders ──────────────────────────────────────────────────────────────

    private loadSequences(): void {
        this.loadingSequences.set(true);
        this.paramService.getSequences(0, 200).subscribe({
            next: res => {
                this.allSequences = res.content;
                this.sequenceOptions.set(res.content.map(s => ({ label: s.libelle, value: s.id })));
                this.loadingSequences.set(false);
            },
            error: () => this.loadingSequences.set(false)
        });
    }

    private loadAllClasses(): void {
        this.loadingClasses.set(true);
        this.paramService.getClasses(0, 200).subscribe({
            next: res => {
                this.allClasses = res.content;
                this.classeOptions.set(res.content.map(c => ({ label: c.libelle, value: c.id })));
                this.loadingClasses.set(false);
            },
            error: () => this.loadingClasses.set(false)
        });
    }

    private loadAllMatieres(): void {
        this.loadingMatieres.set(true);
        this.paramService.getMatieres(0, 200).subscribe({
            next: res => {
                this.allMatieres = res.content;
                this.matiereOptions.set(res.content.map(m => ({ label: m.libelle, value: m.id })));
                this.loadingMatieres.set(false);
            },
            error: () => this.loadingMatieres.set(false)
        });
    }

    private loadEnseignantClasses(): void {
        if (!this.personnelId) return;
        this.loadingClasses.set(true);
        this.edtService.getByEnseignant(this.personnelId).subscribe({
            next: creneaux => {
                const seen = new Set<string>();
                const pairs: typeof this.enseignantPairs = [];
                for (const cr of creneaux) {
                    const key = `${cr.classeId}:${cr.matiereId}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        pairs.push({ classeId: cr.classeId, classeLibelle: cr.classeLibelle, matiereId: cr.matiereId, matiereLibelle: cr.matiereLibelle });
                    }
                }
                this.enseignantPairs = pairs;
                const seen2 = new Set<string>();
                const opts: Opt[] = [];
                for (const p of pairs) {
                    if (!seen2.has(p.classeId)) {
                        seen2.add(p.classeId);
                        opts.push({ label: p.classeLibelle, value: p.classeId });
                    }
                }
                this.classeOptions.set(opts);
                this.loadingClasses.set(false);
            },
            error: () => this.loadingClasses.set(false)
        });
    }

    private loadProfPrincipalClasses(): void {
        if (!this.personnelId) return;
        this.loadingClasses.set(true);
        this.paramService.getClasses(0, 200).subscribe({
            next: res => {
                this.allClasses = res.content;
                const profClasses = res.content.filter(c => c.professeurPrincipalId === this.personnelId);
                if (profClasses.length === 0) {
                    this.showEmptyProfPrincipal.set(true);
                    this.loadingClasses.set(false);
                    return;
                }
                this.classeOptions.set(profClasses.map(c => ({ label: c.libelle, value: c.id })));
                this.loadingClasses.set(false);
                this.loadAllMatieres();
            },
            error: () => this.loadingClasses.set(false)
        });
    }

    // ── Handlers ─────────────────────────────────────────────────────────────

    // Séquence est indépendante : ne réinitialise ni classe ni matière
    onSequenceChange(id: string | null): void {
        this.selectedSequenceId.set(id);
        this.emitIfComplete();
    }

    // La classe réinitialise seulement la matière (qui dépend d'elle)
    onClasseChange(id: string | null): void {
        this.selectedClasseId.set(id);
        this.selectedMatiereId.set(null);
        this.emitIfComplete();

        if (!id) { this.matiereOptions.set([]); return; }

        if (this.isEnseignant && this.mode === 'saisie') {
            this.matiereOptions.set(
                this.enseignantPairs
                    .filter(p => p.classeId === id)
                    .map(p => ({ label: p.matiereLibelle, value: p.matiereId }))
            );
        }
    }

    // La matière est une feuille : ne réinitialise rien
    onMatiereChange(id: string | null): void {
        this.selectedMatiereId.set(id);
        this.emitIfComplete();
    }

    private emitIfComplete(): void {
        const cId = this.selectedClasseId();
        const mId = this.selectedMatiereId();
        const sId = this.selectedSequenceId();
        if (!cId || !mId || !sId) { this.selectionChange.emit(null); return; }

        this.selectionChange.emit({
            classeId:        cId,
            classeLibelle:   this.getClasseLibelle(cId),
            matiereId:       mId,
            matiereLibelle:  this.getMatiereLibelle(mId),
            sequenceId:      sId,
            sequenceLibelle: this.getSequenceLibelle(sId)
        });
    }

    private getClasseLibelle(id: string): string {
        if (this.isEnseignant && this.mode === 'saisie') {
            return this.enseignantPairs.find(p => p.classeId === id)?.classeLibelle ?? id;
        }
        return this.allClasses.find(c => c.id === id)?.libelle ?? id;
    }

    private getMatiereLibelle(id: string): string {
        if (this.isEnseignant && this.mode === 'saisie') {
            return this.enseignantPairs.find(p => p.matiereId === id)?.matiereLibelle ?? id;
        }
        return this.allMatieres.find(m => m.id === id)?.libelle ?? id;
    }

    private getSequenceLibelle(id: string): string {
        return this.allSequences.find(s => s.id === id)?.libelle ?? id;
    }
}
