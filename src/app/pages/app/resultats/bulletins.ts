import {
    ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { EleveService, EleveResponse } from '@/app/core/services/eleve.service';
import { ParametrageService, SequenceResponse, TrimestreResponse } from '@/app/core/services/parametrage.service';
import {
    ResultatsService, MoyennesResponse, MoyenneTrimestreResponse
} from '@/app/core/services/resultats.service';

type Opt = { label: string; value: string };
type Mode = 'sequence' | 'trimestre';

@Component({
    selector: 'app-bulletins',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, InputTextModule, SelectModule, MessageModule, SkeletonModule
    ],
    styles: [`
        :host { display: block; padding: 24px; max-width: 900px; }
        h1 { font-size: 22px; font-weight: 700; margin: 0 0 6px; color: var(--color-text); }
        .bl-sub { font-size: 13px; color: var(--color-text-muted); margin: 0 0 20px; }

        /* ── Mode toggle ── */
        .bl-mode-bar {
            display: flex; gap: 0; margin-bottom: 24px;
            border: 1px solid var(--color-border); border-radius: var(--radius-md);
            overflow: hidden; width: fit-content;
        }
        .bl-mode-btn {
            padding: 8px 20px; font-size: 13px; font-weight: 600;
            background: var(--color-surface); color: var(--color-text-muted);
            border: none; cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .bl-mode-btn:not(:last-child) { border-right: 1px solid var(--color-border); }
        .bl-mode-btn.active {
            background: var(--color-primary); color: #fff;
        }
        .bl-mode-btn:not(.active):hover { background: var(--color-surface-alt); color: var(--color-text); }

        /* ── Étapes ── */
        .bl-step { margin-bottom: 24px; }
        .bl-step-header {
            display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
        }
        .bl-step-num {
            width: 24px; height: 24px; border-radius: 50%;
            background: var(--color-primary); color: #fff;
            font-size: 12px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .bl-step-label { font-size: 13px; font-weight: 700; color: var(--color-text); }
        .bl-step--done .bl-step-num { background: #15803d; }

        /* ── Recherche ── */
        .bl-search-wrap { display: flex; gap: 10px; align-items: center; }
        .bl-search-input { flex: 1; }

        /* ── Résultats recherche ── */
        .bl-results {
            max-height: 220px; overflow-y: auto;
            border: 1px solid var(--color-border); border-radius: var(--radius-md);
            margin-top: 10px;
        }
        .bl-result-row {
            padding: 10px 14px; cursor: pointer; font-size: 13px;
            border-bottom: 1px solid var(--color-border);
            display: flex; justify-content: space-between; align-items: center;
        }
        .bl-result-row:last-child { border-bottom: 0; }
        .bl-result-row:hover { background: var(--color-primary-soft); }
        .bl-matricule { font-family: monospace; font-size: 11px; color: var(--color-text-muted); }

        /* ── Élève sélectionné ── */
        .bl-selected-banner {
            background: var(--color-primary-soft); border: 1px solid var(--color-primary);
            border-radius: var(--radius-md); padding: 11px 16px;
            display: flex; justify-content: space-between; align-items: center;
            margin-top: 10px; font-size: 14px; font-weight: 600; color: var(--color-primary);
        }

        /* ── Tableau moyennes ── */
        .bl-moy-section { margin-top: 24px; }
        .bl-moy-title {
            font-size: 14px; font-weight: 700; color: var(--color-text);
            margin-bottom: 10px;
            display: flex; align-items: center; gap: 8px;
        }
        .bl-table-wrap { border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
            background: var(--color-surface-alt); padding: 10px 14px;
            text-align: left; font-weight: 700; font-size: 11px;
            text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted);
            border-bottom: 1px solid var(--color-border);
        }
        thead th:not(:first-child) { text-align: center; }
        tbody tr { border-bottom: 1px solid var(--color-border); }
        tbody tr:last-child { border-bottom: 0; }
        tbody tr:hover { background: var(--color-surface-alt); }
        tbody td { padding: 9px 14px; color: var(--color-text); }
        tbody td:not(:first-child) { text-align: center; }
        tbody td.td-poids { color: var(--color-text-muted); }
        td.td-moy-tri { font-weight: 700; color: var(--color-primary); }
        .bl-moy-generale {
            display: flex; justify-content: flex-end; align-items: center; gap: 14px;
            padding: 12px 16px; border-top: 2px solid var(--color-border);
            background: var(--color-surface-alt);
            font-weight: 700; font-size: 14px; color: var(--color-text);
        }
        .bl-moy-val { font-size: 20px; font-weight: 800; color: var(--color-primary); }
        .bl-actions { display: flex; justify-content: flex-end; }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <h1>
            <i class="pi pi-file-pdf mr-2" style="color:var(--color-primary)"></i>
            {{ t('resultats.bulletins.titre') }}
        </h1>
        <p class="bl-sub">{{ t('resultats.bulletins.sousTitre') }}</p>

        <!-- ── Sélecteur de mode ── -->
        <div class="bl-mode-bar">
            <button class="bl-mode-btn" [class.active]="mode() === 'sequence'"
                (click)="setMode('sequence')">
                <i class="pi pi-list mr-1"></i>{{ t('resultats.bulletins.modeSequence') }}
            </button>
            <button class="bl-mode-btn" [class.active]="mode() === 'trimestre'"
                (click)="setMode('trimestre')">
                <i class="pi pi-calendar mr-1"></i>{{ t('resultats.bulletins.modeTrimestre') }}
            </button>
        </div>

        <!-- ════════════════ MODE SÉQUENCE ════════════════ -->
        @if (mode() === 'sequence') {

            <!-- Étape 1 : Séquence -->
            <div class="bl-step" [class.bl-step--done]="selectedSequenceId()">
                <div class="bl-step-header">
                    <span class="bl-step-num">1</span>
                    <span class="bl-step-label">{{ t('resultats.bulletins.etape1') }}</span>
                </div>
                <p-select
                    [ngModel]="selectedSequenceId()"
                    (ngModelChange)="onSequenceChange($event)"
                    [options]="sequenceOptions()"
                    optionLabel="label" optionValue="value"
                    [showClear]="true"
                    [placeholder]="t('resultats.bulletins.choisirSequence')"
                    [loading]="loadingSequences()"
                    style="min-width:260px">
                </p-select>
            </div>

            <!-- Étape 2 : Élève (séquence) -->
            <div class="bl-step">
                <div class="bl-step-header">
                    <span class="bl-step-num">2</span>
                    <span class="bl-step-label">{{ t('resultats.bulletins.etape2') }}</span>
                </div>
                @if (!selectedEleve()) {
                    <div class="bl-search-wrap">
                        <input pInputText class="bl-search-input"
                            [(ngModel)]="searchQuery"
                            [disabled]="!selectedSequenceId()"
                            [placeholder]="selectedSequenceId()
                                ? t('resultats.bulletins.recherchePlaceholder')
                                : t('resultats.bulletins.rechercheDisablee')"
                            (ngModelChange)="onSearchChange()">
                    </div>
                    @if (searchQuery.length > 0 && searchQuery.length < 2) {
                        <small style="color:var(--color-text-muted);margin-top:4px;display:block;font-size:12px">
                            {{ t('resultats.bulletins.miniCaracteres') }}
                        </small>
                    }
                    @if (searchLoading()) {
                        <div class="bl-results">
                            @for (i of [1,2,3]; track i) {
                                <div class="bl-result-row">
                                    <p-skeleton width="200px" height="14px"></p-skeleton>
                                    <p-skeleton width="80px" height="14px"></p-skeleton>
                                </div>
                            }
                        </div>
                    } @else if (eleveResults().length > 0) {
                        <div class="bl-results">
                            @for (eleve of eleveResults(); track eleve.id) {
                                <div class="bl-result-row" (click)="selectEleve(eleve)">
                                    <span>{{ eleve.prenom }} {{ eleve.nom }} — {{ eleve.classeLibelle }}</span>
                                    <span class="bl-matricule">{{ eleve.matricule }}</span>
                                </div>
                            }
                        </div>
                    }
                } @else {
                    <div class="bl-selected-banner">
                        <span>{{ selectedEleve()!.prenom }} {{ selectedEleve()!.nom }} — {{ selectedEleve()!.classeLibelle }}</span>
                        <p-button [label]="t('resultats.bulletins.changerEleve')"
                            icon="pi pi-times" severity="secondary" size="small"
                            (onClick)="clearEleve()">
                        </p-button>
                    </div>
                }
            </div>

            <!-- Moyennes séquence -->
            @if (loadMoyError()) {
                <p-message severity="error" [text]="t('resultats.bulletins.erreurMoyennes')"></p-message>
            }
            @if (loadingMoy()) {
                <p-skeleton height="200px" borderRadius="8px"></p-skeleton>
            }
            @if (moyennes(); as moy) {
                <div class="bl-moy-section">
                    <div class="bl-moy-title">
                        <i class="pi pi-chart-bar" style="color:var(--color-primary)"></i>
                        {{ t('resultats.bulletins.titreMoyennes') }}
                    </div>
                    <div class="bl-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>{{ t('resultats.bulletins.colMatiere') }}</th>
                                    <th>{{ t('resultats.bulletins.colNote') }}</th>
                                    <th>{{ t('resultats.bulletins.colCoefficient') }}</th>
                                    <th>{{ t('resultats.bulletins.colPoids') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (d of moy.details; track d.matiereId) {
                                    <tr>
                                        <td>{{ d.matiereLibelle }}</td>
                                        <td>{{ d.note !== null ? d.note : '—' }}</td>
                                        <td>{{ d.coefficient }}</td>
                                        <td class="td-poids">{{ contribution(d.note, d.coefficient) }}</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                        <div class="bl-moy-generale">
                            <span>{{ t('resultats.bulletins.moyenneGenerale') }}</span>
                            <span class="bl-moy-val">{{ moy.moyenneGenerale !== null ? moy.moyenneGenerale : '—' }}</span>
                        </div>
                    </div>
                    @if (downloadError()) {
                        <p-message severity="error" [text]="downloadError()!" class="mb-3 block"></p-message>
                    }
                    <div class="bl-actions">
                        <p-button
                            [label]="t('resultats.bulletins.telechargerPdf')"
                            icon="pi pi-download"
                            [loading]="downloadingPdf()"
                            [disabled]="downloadingPdf()"
                            (onClick)="downloadPdf()">
                        </p-button>
                    </div>
                </div>
            }

        }

        <!-- ════════════════ MODE TRIMESTRE ════════════════ -->
        @if (mode() === 'trimestre') {

            <!-- Étape 1 : Trimestre -->
            <div class="bl-step" [class.bl-step--done]="selectedTrimestreId()">
                <div class="bl-step-header">
                    <span class="bl-step-num">1</span>
                    <span class="bl-step-label">{{ t('resultats.bulletins.etape1Trimestre') }}</span>
                </div>
                <p-select
                    [ngModel]="selectedTrimestreId()"
                    (ngModelChange)="onTrimestreChange($event)"
                    [options]="trimestreOptions()"
                    optionLabel="label" optionValue="value"
                    [showClear]="true"
                    [placeholder]="t('resultats.bulletins.choisirTrimestre')"
                    [loading]="loadingTrimestres()"
                    style="min-width:280px">
                </p-select>
            </div>

            <!-- Étape 2 : Élève (trimestre) -->
            <div class="bl-step">
                <div class="bl-step-header">
                    <span class="bl-step-num">2</span>
                    <span class="bl-step-label">{{ t('resultats.bulletins.etape2') }}</span>
                </div>
                @if (!selectedEleve()) {
                    <div class="bl-search-wrap">
                        <input pInputText class="bl-search-input"
                            [(ngModel)]="searchQuery"
                            [disabled]="!selectedTrimestreId()"
                            [placeholder]="selectedTrimestreId()
                                ? t('resultats.bulletins.recherchePlaceholder')
                                : t('resultats.bulletins.rechercheDisableeTrimestre')"
                            (ngModelChange)="onSearchChange()">
                    </div>
                    @if (searchQuery.length > 0 && searchQuery.length < 2) {
                        <small style="color:var(--color-text-muted);margin-top:4px;display:block;font-size:12px">
                            {{ t('resultats.bulletins.miniCaracteres') }}
                        </small>
                    }
                    @if (searchLoading()) {
                        <div class="bl-results">
                            @for (i of [1,2,3]; track i) {
                                <div class="bl-result-row">
                                    <p-skeleton width="200px" height="14px"></p-skeleton>
                                    <p-skeleton width="80px" height="14px"></p-skeleton>
                                </div>
                            }
                        </div>
                    } @else if (eleveResults().length > 0) {
                        <div class="bl-results">
                            @for (eleve of eleveResults(); track eleve.id) {
                                <div class="bl-result-row" (click)="selectEleve(eleve)">
                                    <span>{{ eleve.prenom }} {{ eleve.nom }} — {{ eleve.classeLibelle }}</span>
                                    <span class="bl-matricule">{{ eleve.matricule }}</span>
                                </div>
                            }
                        </div>
                    }
                } @else {
                    <div class="bl-selected-banner">
                        <span>{{ selectedEleve()!.prenom }} {{ selectedEleve()!.nom }} — {{ selectedEleve()!.classeLibelle }}</span>
                        <p-button [label]="t('resultats.bulletins.changerEleve')"
                            icon="pi pi-times" severity="secondary" size="small"
                            (onClick)="clearEleve()">
                        </p-button>
                    </div>
                }
            </div>

            <!-- Moyennes trimestre -->
            @if (loadMoyTriError()) {
                <p-message severity="error" [text]="t('resultats.bulletins.erreurMoyennesTrimestre')"></p-message>
            }
            @if (loadingMoyTri()) {
                <p-skeleton height="200px" borderRadius="8px"></p-skeleton>
            }
            @if (moyennesTrimestre(); as moy) {
                <div class="bl-moy-section">
                    <div class="bl-moy-title">
                        <i class="pi pi-chart-bar" style="color:var(--color-primary)"></i>
                        {{ t('resultats.bulletins.titreMoyennes') }}
                        &nbsp;<span style="font-weight:400;color:var(--color-text-muted);font-size:12px">
                            — {{ moy.trimestreLibelle }} {{ moy.anneeScolaire }}
                        </span>
                    </div>
                    <div class="bl-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>{{ t('resultats.bulletins.colMatiere') }}</th>
                                    <th>{{ moy.sequenceS1Libelle ?? t('resultats.bulletins.colNoteS1') }}</th>
                                    <th>{{ moy.sequenceS2Libelle ?? t('resultats.bulletins.colNoteS2') }}</th>
                                    <th>{{ t('resultats.bulletins.colMoyTrimestre') }}</th>
                                    <th>{{ t('resultats.bulletins.colCoefficient') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (d of moy.details; track d.matiereId) {
                                    <tr>
                                        <td>{{ d.matiereLibelle }}</td>
                                        <td>{{ d.noteS1 !== null ? d.noteS1 : '—' }}</td>
                                        <td>{{ d.noteS2 !== null ? d.noteS2 : '—' }}</td>
                                        <td class="td-moy-tri">{{ d.noteTrimestre !== null ? d.noteTrimestre : '—' }}</td>
                                        <td>{{ d.coefficient }}</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                        <div class="bl-moy-generale">
                            <span>{{ t('resultats.bulletins.moyenneGenerale') }}</span>
                            <span class="bl-moy-val">{{ moy.moyenneGenerale !== null ? moy.moyenneGenerale : '—' }}</span>
                        </div>
                    </div>
                    @if (downloadErrorTri()) {
                        <p-message severity="error" [text]="downloadErrorTri()!" class="mb-3 block"></p-message>
                    }
                    <div class="bl-actions">
                        <p-button
                            [label]="t('resultats.bulletins.telechargerPdfTrimestre')"
                            icon="pi pi-download"
                            [loading]="downloadingPdfTri()"
                            [disabled]="downloadingPdfTri()"
                            (onClick)="downloadPdfTrimestre()">
                        </p-button>
                    </div>
                </div>
            }

        }

    </ng-container>
    `
})
export class Bulletins implements OnInit {
    private eleveService     = inject(EleveService);
    private paramService     = inject(ParametrageService);
    private resultatsService = inject(ResultatsService);

    searchQuery = '';

    // ── Mode ──
    readonly mode = signal<Mode>('sequence');

    // ── Séquence mode ──
    readonly selectedSequenceId  = signal<string | null>(null);
    readonly sequenceOptions     = signal<Opt[]>([]);
    readonly loadingSequences    = signal(false);
    readonly moyennes            = signal<MoyennesResponse | null>(null);
    readonly loadingMoy          = signal(false);
    readonly loadMoyError        = signal(false);
    readonly downloadingPdf      = signal(false);
    readonly downloadError       = signal<string | null>(null);

    // ── Trimestre mode ──
    readonly selectedTrimestreId = signal<string | null>(null);
    readonly trimestreOptions    = signal<Opt[]>([]);
    readonly loadingTrimestres   = signal(false);
    readonly moyennesTrimestre   = signal<MoyenneTrimestreResponse | null>(null);
    readonly loadingMoyTri       = signal(false);
    readonly loadMoyTriError     = signal(false);
    readonly downloadingPdfTri   = signal(false);
    readonly downloadErrorTri    = signal<string | null>(null);

    // ── Shared (élève search) ──
    readonly eleveResults        = signal<EleveResponse[]>([]);
    readonly searchLoading       = signal(false);
    readonly selectedEleve       = signal<EleveResponse | null>(null);

    private allSequences: SequenceResponse[] = [];
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    ngOnInit(): void {
        this.loadingSequences.set(true);
        this.paramService.getSequences(0, 200).subscribe({
            next: res => {
                this.allSequences = res.content;
                this.sequenceOptions.set(res.content.map(s => ({ label: s.libelle, value: s.id })));
                this.loadingSequences.set(false);
            },
            error: () => this.loadingSequences.set(false)
        });

        this.loadingTrimestres.set(true);
        this.paramService.getTrimestres(0, 100, 'dateDebut,asc').subscribe({
            next: res => {
                this.trimestreOptions.set(
                    res.content.map((t: TrimestreResponse) => ({
                        label: `${t.libelle} — ${t.anneeScolaire}`,
                        value: t.id
                    }))
                );
                this.loadingTrimestres.set(false);
            },
            error: () => this.loadingTrimestres.set(false)
        });
    }

    setMode(m: Mode): void {
        if (this.mode() === m) return;
        this.mode.set(m);
        this.selectedEleve.set(null);
        this.moyennes.set(null);
        this.moyennesTrimestre.set(null);
        this.selectedSequenceId.set(null);
        this.selectedTrimestreId.set(null);
        this.searchQuery = '';
        this.eleveResults.set([]);
        this.loadMoyError.set(false);
        this.loadMoyTriError.set(false);
        this.downloadError.set(null);
        this.downloadErrorTri.set(null);
    }

    onSequenceChange(id: string | null): void {
        this.selectedSequenceId.set(id);
        const eleve = this.selectedEleve();
        if (eleve && id) {
            this.loadMoyennesSeq(eleve, id);
        } else {
            this.moyennes.set(null);
        }
    }

    onTrimestreChange(id: string | null): void {
        this.selectedTrimestreId.set(id);
        const eleve = this.selectedEleve();
        if (eleve && id) {
            this.loadMoyennesTri(eleve, id);
        } else {
            this.moyennesTrimestre.set(null);
        }
    }

    onSearchChange(): void {
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.searchEleves(), 350);
    }

    private searchEleves(): void {
        const q = this.searchQuery.trim();
        if (q.length < 2) { this.eleveResults.set([]); return; }
        const isMatricule = /^[A-Z]{1,4}-\d{4}-|^\d{4}[GF]/i.test(q);
        const params = isMatricule ? { matricule: q } : { nom: q };
        this.searchLoading.set(true);
        this.eleveService.rechercher(params, 0, 10).subscribe({
            next: res => { this.eleveResults.set(res.content); this.searchLoading.set(false); },
            error: () => this.searchLoading.set(false)
        });
    }

    selectEleve(eleve: EleveResponse): void {
        if (this.mode() === 'sequence') {
            if (!this.selectedSequenceId()) return;
            this.selectedEleve.set(eleve);
            this.eleveResults.set([]);
            this.loadMoyennesSeq(eleve, this.selectedSequenceId()!);
        } else {
            if (!this.selectedTrimestreId()) return;
            this.selectedEleve.set(eleve);
            this.eleveResults.set([]);
            this.loadMoyennesTri(eleve, this.selectedTrimestreId()!);
        }
    }

    clearEleve(): void {
        this.selectedEleve.set(null);
        this.moyennes.set(null);
        this.moyennesTrimestre.set(null);
        this.loadMoyError.set(false);
        this.loadMoyTriError.set(false);
        this.searchQuery = '';
        this.eleveResults.set([]);
    }

    private loadMoyennesSeq(eleve: EleveResponse, sequenceId: string): void {
        this.loadingMoy.set(true);
        this.loadMoyError.set(false);
        this.moyennes.set(null);
        this.resultatsService.getMoyennesEleve(eleve.id, sequenceId).subscribe({
            next: moy => { this.moyennes.set(moy); this.loadingMoy.set(false); },
            error: () => { this.loadMoyError.set(true); this.loadingMoy.set(false); }
        });
    }

    private loadMoyennesTri(eleve: EleveResponse, trimestreId: string): void {
        this.loadingMoyTri.set(true);
        this.loadMoyTriError.set(false);
        this.moyennesTrimestre.set(null);
        this.resultatsService.getMoyennesTrimestre(eleve.id, trimestreId).subscribe({
            next: moy => { this.moyennesTrimestre.set(moy); this.loadingMoyTri.set(false); },
            error: () => { this.loadMoyTriError.set(true); this.loadingMoyTri.set(false); }
        });
    }

    contribution(note: number | null, coeff: number): string {
        return note !== null ? (note * coeff).toFixed(2) : '—';
    }

    downloadPdf(): void {
        const eleve = this.selectedEleve();
        const seqId = this.selectedSequenceId();
        if (!eleve || !seqId) return;
        const seqLibelle = this.allSequences.find(s => s.id === seqId)?.libelle ?? seqId;
        this.downloadingPdf.set(true);
        this.downloadError.set(null);
        this.resultatsService.getBulletinPdf(eleve.id, seqId).subscribe({
            next: blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bulletin_${eleve.matricule}_${seqLibelle}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                this.downloadingPdf.set(false);
            },
            error: err => {
                this.downloadingPdf.set(false);
                const msg = err?.error?.message;
                this.downloadError.set(typeof msg === 'string' ? msg : 'Impossible de télécharger le bulletin PDF. Veuillez réessayer.');
            }
        });
    }

    downloadPdfTrimestre(): void {
        const eleve = this.selectedEleve();
        const triId = this.selectedTrimestreId();
        const moy   = this.moyennesTrimestre();
        if (!eleve || !triId) return;
        const triLibelle = moy?.trimestreLibelle ?? triId;
        this.downloadingPdfTri.set(true);
        this.downloadErrorTri.set(null);
        this.resultatsService.getBulletinTrimestrePdf(eleve.id, triId).subscribe({
            next: blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bulletin_trimestre_${eleve.matricule}_${triLibelle}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                this.downloadingPdfTri.set(false);
            },
            error: err => {
                this.downloadingPdfTri.set(false);
                const msg = err?.error?.message;
                this.downloadErrorTri.set(typeof msg === 'string' ? msg : 'Impossible de télécharger le bulletin PDF. Veuillez réessayer.');
            }
        });
    }
}
