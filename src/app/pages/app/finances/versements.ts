import {
    ChangeDetectionStrategy, Component, ElementRef, inject, signal, ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { EleveService, EleveResponse } from '@/app/core/services/eleve.service';
import {
    FinancesService, VersementResponse, SoldeResponse
} from '@/app/core/services/finances.service';

@Component({
    selector: 'app-versements',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, InputNumberModule, InputTextModule, MessageModule, SkeletonModule
    ],
    styles: [`
        :host {
            display: block; padding: 28px; max-width: 1060px;
            --c-ok-fg: #166534; --c-ok-bg: #f0fdf4; --c-ok-bd: #bbf7d0;
            --c-warn-fg: #92400e; --c-warn-bg: #fffbeb; --c-warn-bd: #f59e0b;
            --c-blue-fg: #1e40af; --c-blue-bg: #eff6ff; --c-blue-bd: #bfdbfe;
        }
        /* ── Header ── */
        .fv-header { display: flex; align-items: center; gap: 18px; margin-bottom: 28px; }
        .fv-header-icon {
            width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
            background: var(--c-ok-bg); border: 1px solid var(--c-ok-bd);
            display: flex; align-items: center; justify-content: center;
        }
        .fv-header-icon i { font-size: 24px; color: var(--c-ok-fg); }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 3px; color: var(--color-text); }
        .fv-sub { font-size: 14px; color: var(--color-text-muted); margin: 0; }
        /* ── Feedback global ── */
        .fv-feedback { margin-bottom: 16px; }
        /* ── Cards ── */
        .fv-card {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.05);
            padding: 22px 24px; margin-bottom: 16px;
        }
        .fv-card-accent-green  { border-top: 3px solid var(--c-ok-fg); }
        .fv-card-accent-primary { border-top: 3px solid var(--color-primary); }
        h2 { font-size: 14px; font-weight: 700; margin: 0 0 16px; color: var(--color-text);
             display: flex; align-items: center; gap: 8px; }
        /* ── Recherche ── */
        .fv-search-wrap { display: flex; flex-direction: column; gap: 8px; max-width: 500px; }
        .fv-results {
            max-height: 220px; overflow-y: auto;
            border: 1px solid var(--color-border); border-radius: 8px;
            box-shadow: 0 6px 16px rgba(0,0,0,.1);
        }
        .fv-result-row {
            padding: 11px 16px; cursor: pointer; font-size: 13px;
            border-bottom: 1px solid var(--color-border);
            display: flex; justify-content: space-between; align-items: center;
            transition: background .12s;
        }
        .fv-result-row:last-child { border-bottom: 0; }
        .fv-result-row:hover { background: var(--color-primary-soft); }
        .fv-result-name { font-weight: 600; }
        .fv-result-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .fv-matricule { font-family: monospace; font-size: 11px; color: var(--color-text-muted); }
        .fv-classe { font-size: 11px; color: var(--color-text-muted); }
        .fv-no-result {
            padding: 16px; font-size: 13px; color: var(--color-text-muted);
            text-align: center; display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        /* ── Banner élève ── */
        .fv-eleve-banner {
            background: linear-gradient(135deg, var(--c-ok-bg) 0%, #e0f2fe 100%);
            border: 1px solid var(--c-ok-bd); border-radius: 10px;
            padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;
        }
        .fv-eleve-name { font-weight: 800; font-size: 16px; color: var(--color-text); }
        .fv-eleve-meta { font-size: 12px; color: var(--color-text-muted); margin-top: 3px; }
        /* ── Solde ── */
        .fv-solde-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
        }
        .fv-solde-cell {
            background: var(--color-surface-alt); border: 1px solid var(--color-border);
            border-radius: 10px; padding: 14px 16px; position: relative; overflow: hidden;
        }
        .fv-solde-cell::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
        }
        .fv-solde-cell.neutral::before { background: var(--color-border); }
        .fv-solde-cell.ok::before { background: var(--c-ok-fg); }
        .fv-solde-cell.danger::before { background: var(--color-danger); }
        .fv-solde-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            letter-spacing: .6px; color: var(--color-text-muted); margin-bottom: 6px;
        }
        .fv-solde-value { font-size: 20px; font-weight: 800; color: var(--color-text); }
        .fv-solde-value.ok { color: var(--c-ok-fg); }
        .fv-solde-value.danger { color: var(--color-danger); }
        .fv-solde-value.zero { color: var(--c-ok-fg); }
        /* ── Formulaire ── */
        .fv-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; max-width: 280px; }
        .fv-label { font-size: 13px; font-weight: 600; color: var(--color-text); }
        .fv-req { color: var(--color-danger); }
        .fv-form-footer { display: flex; align-items: center; justify-content: space-between; }
        .fv-form-hint { font-size: 12px; color: var(--color-text-muted); font-style: italic; }
        /* ── Historique ── */
        .fv-hist-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .fv-count {
            min-width: 24px; height: 22px; border-radius: 11px; padding: 0 8px;
            background: var(--color-primary); color: #fff;
            font-size: 11px; font-weight: 700;
            display: inline-flex; align-items: center; justify-content: center;
        }
        .fv-trunc-note { font-size: 11px; color: var(--color-text-muted); font-style: italic; margin-left: auto; }
        .fv-table-wrap { border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
            background: var(--color-surface-alt); padding: 10px 14px; text-align: left;
            font-weight: 700; font-size: 10px; text-transform: uppercase;
            letter-spacing: .5px; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border);
        }
        tbody tr { border-bottom: 1px solid var(--color-border); transition: background .1s; }
        tbody tr:last-child { border-bottom: 0; }
        tbody tr:hover { background: var(--color-surface-alt); }
        tbody td { padding: 10px 14px; color: var(--color-text); vertical-align: middle; }
        .fv-td-date { white-space: nowrap; font-family: monospace; font-size: 12px;
            color: var(--color-text-muted); }
        .fv-td-montant { font-weight: 800; white-space: nowrap; font-size: 14px; }
        .fv-quittance { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }
        .fv-motif-rejet { font-size: 11px; color: var(--color-danger); margin-top: 4px;
            font-style: italic; max-width: 200px; word-break: break-word; }
        .fv-en-attente-info { font-size: 11px; color: var(--c-warn-fg); margin-top: 4px; font-style: italic; }
        .fv-empty {
            padding: 36px 16px; text-align: center; color: var(--color-text-muted);
            font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .fv-empty i { font-size: 32px; opacity: .3; }
        /* ── Badges statut ── */
        .fv-stat-valid  { background: var(--c-ok-bg); color: var(--c-ok-fg); border: 1px solid var(--c-ok-bd);
            border-radius: 6px; padding: 3px 9px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .fv-stat-wait   { background: var(--c-warn-bg); color: var(--c-warn-fg); border: 1px solid var(--c-warn-bd);
            border-radius: 6px; padding: 3px 9px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .fv-stat-reject { background: #fef2f2; color: var(--color-danger); border: 1px solid #fecaca;
            border-radius: 6px; padding: 3px 9px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        /* ── Badges mode paiement ── */
        .fv-mode-caisse  { background: var(--color-surface-alt); color: var(--color-text-muted);
            border: 1px solid var(--color-border); border-radius: 5px; padding: 2px 7px;
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; }
        .fv-mode-banque  { background: var(--c-blue-bg); color: var(--c-blue-fg);
            border: 1px solid var(--c-blue-bd); border-radius: 5px; padding: 2px 7px;
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; }
        /* ── Bouton PDF ── */
        .fv-pdf-btn { display: inline-flex; align-items: center; gap: 5px;
            background: var(--color-surface-alt); border: 1px solid var(--color-border);
            border-radius: 7px; padding: 5px 10px; cursor: pointer; font-size: 12px;
            font-weight: 600; color: var(--color-text); transition: all .15s; }
        .fv-pdf-btn:hover { background: var(--color-primary-soft); border-color: var(--color-primary);
            color: var(--color-primary); }
        .fv-pdf-btn i { font-size: 14px; color: #dc2626; }
        .fv-pdf-btn.loading { opacity: .6; pointer-events: none; }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <div class="fv-header">
            <div class="fv-header-icon"><i class="pi pi-wallet" aria-hidden="true"></i></div>
            <div>
                <h1>{{ t('finances.versements.titre') }}</h1>
                <p class="fv-sub">{{ t('finances.versements.sousTitre') }}</p>
            </div>
        </div>

        <!-- Feedback global -->
        @if (feedbackError()) {
            <div class="fv-feedback"><p-message severity="error" [text]="feedbackError()!"></p-message></div>
        }
        @if (feedbackSuccess()) {
            <div class="fv-feedback"><p-message severity="success" [text]="feedbackSuccess()!"></p-message></div>
        }

        <!-- Carte recherche / banner élève -->
        <div class="fv-card">
            @if (!selectedEleve()) {
                <h2><i class="pi pi-search" aria-hidden="true"></i> {{ t('finances.versements.rechercheEleve') }}</h2>
                <div class="fv-search-wrap">
                    <input pInputText [(ngModel)]="searchQuery"
                        [placeholder]="t('finances.versements.recherchePlaceholder')"
                        (ngModelChange)="onSearchChange()" style="width:100%"
                        [attr.aria-label]="t('finances.versements.rechercheEleve')">

                    @if (searchLoading()) {
                        <div class="fv-results">
                            @for (i of [1,2,3]; track i) {
                                <div class="fv-result-row"><p-skeleton width="220px" height="14px"></p-skeleton></div>
                            }
                        </div>
                    } @else if (didSearch() && eleveResults().length === 0) {
                        <div class="fv-results">
                            <div class="fv-no-result"><i class="pi pi-search"></i>{{ t('finances.versements.aucunResultat') }}</div>
                        </div>
                    } @else if (eleveResults().length > 0) {
                        <div class="fv-results" role="listbox">
                            @for (e of eleveResults(); track e.id) {
                                <div class="fv-result-row" role="option" (click)="selectEleve(e)" (keydown.enter)="selectEleve(e)" tabindex="0">
                                    <span class="fv-result-name">{{ e.prenom }} {{ e.nom }}</span>
                                    <div class="fv-result-meta">
                                        <span class="fv-matricule">{{ e.matricule }}</span>
                                        <span class="fv-classe">{{ e.classeLibelle }}</span>
                                    </div>
                                </div>
                            }
                        </div>
                    }
                </div>
            } @else {
                <div class="fv-eleve-banner">
                    <div>
                        <div class="fv-eleve-name">{{ selectedEleve()!.prenom }} {{ selectedEleve()!.nom }}</div>
                        <div class="fv-eleve-meta">{{ selectedEleve()!.classeLibelle }} · {{ selectedEleve()!.matricule }}</div>
                    </div>
                    <p-button severity="secondary" size="small" [label]="t('finances.versements.changerEleve')"
                        icon="pi pi-times" (onClick)="clearEleve()"></p-button>
                </div>
            }
        </div>

        @if (selectedEleve()) {

            <!-- Carte solde (accent vert) -->
            <div class="fv-card fv-card-accent-green">
                @if (loadingSolde()) {
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
                        @for (i of [1,2,3]; track i) { <p-skeleton height="68px" borderRadius="10px"></p-skeleton> }
                    </div>
                } @else if (solde()) {
                    <div class="fv-solde-grid">
                        <div class="fv-solde-cell neutral">
                            <div class="fv-solde-label">{{ t('finances.versements.tauxScolarite') }}</div>
                            <div class="fv-solde-value">{{ formatFcfa(solde()!.tauxScolarite) }}</div>
                        </div>
                        <div class="fv-solde-cell ok">
                            <div class="fv-solde-label">{{ t('finances.versements.totalVerse') }}</div>
                            <div class="fv-solde-value" [class.ok]="solde()!.totalVerse > 0" [class.zero]="solde()!.totalVerse === 0">
                                {{ formatFcfa(solde()!.totalVerse) }}
                            </div>
                        </div>
                        <div class="fv-solde-cell" [class.danger]="solde()!.soldeRestant > 0" [class.ok]="solde()!.soldeRestant === 0">
                            <div class="fv-solde-label">{{ t('finances.versements.soldeRestant') }}</div>
                            <div class="fv-solde-value" [class.danger]="solde()!.soldeRestant > 0" [class.ok]="solde()!.soldeRestant === 0">
                                {{ formatFcfa(solde()!.soldeRestant) }}
                            </div>
                        </div>
                    </div>
                }
            </div>

            <!-- Formulaire versement caisse (accent primary) -->
            <div class="fv-card fv-card-accent-primary">
                <h2><i class="pi pi-plus-circle" aria-hidden="true"></i> {{ t('finances.versements.nouveauTitre') }}</h2>
                <div class="fv-form-group" #montantRef>
                    <label class="fv-label" for="montantInput">{{ t('finances.versements.montant') }} <span class="fv-req">*</span></label>
                    <p-inputnumber inputId="montantInput"
                        [(ngModel)]="montant"
                        [min]="0.01" [minFractionDigits]="0" [maxFractionDigits]="0"
                        [class.p-invalid]="showErrors() && (!montant || montant <= 0)"
                        [placeholder]="t('finances.versements.montantPlaceholder')">
                    </p-inputnumber>
                    @if (showErrors() && (!montant || montant <= 0)) {
                        <small style="font-size:12px;color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                    }
                </div>
                <div class="fv-form-footer">
                    <span class="fv-form-hint"><i class="pi pi-info-circle"></i> {{ t('finances.versements.modeCaisseInfo') }}</span>
                    <p-button [label]="t('finances.versements.enregistrer')" icon="pi pi-check"
                        severity="success" [loading]="saving()" (onClick)="onSave()"
                        [attr.aria-label]="t('finances.versements.enregistrer')"></p-button>
                </div>
            </div>

            <!-- Historique des versements -->
            <div class="fv-card">
                <div class="fv-hist-header">
                    <h2 style="margin:0"><i class="pi pi-history" aria-hidden="true"></i> {{ t('finances.versements.historique') }}</h2>
                    @if (!loadingHist()) {
                        <span class="fv-count">{{ history().totalElements }}</span>
                        @if (history().totalElements > history().content.length) {
                            <span class="fv-trunc-note">{{ t('finances.versements.afficheN', { n: history().content.length, total: history().totalElements }) }}</span>
                        }
                    }
                </div>

                @if (loadingHist()) {
                    <p-skeleton height="120px" borderRadius="8px"></p-skeleton>
                } @else if (history().content.length === 0) {
                    <div class="fv-empty"><i class="pi pi-inbox"></i>{{ t('finances.versements.aucunHistorique') }}</div>
                } @else {
                    <div class="fv-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width:120px">{{ t('finances.versements.colDate') }}</th>
                                    <th style="width:150px">{{ t('finances.versements.colMontant') }}</th>
                                    <th style="width:90px">{{ t('finances.versements.colMode') }}</th>
                                    <th>{{ t('finances.versements.colQuittance') }}</th>
                                    <th style="width:160px">{{ t('finances.versements.colStatut') }}</th>
                                    <th style="width:80px" class="sr-only">{{ t('finances.versements.colActions') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (v of history().content; track v.id) {
                                    <tr>
                                        <td class="fv-td-date">{{ formatDate(v.dateVersement) }}</td>
                                        <td class="fv-td-montant">{{ formatFcfa(v.montant) }}</td>
                                        <td>
                                            @if (v.modePaiement === 'CAISSE') {
                                                <span class="fv-mode-caisse">{{ t('finances.versements.modeCAISSE') }}</span>
                                            } @else {
                                                <span class="fv-mode-banque">{{ t('finances.versements.modeBANCAIRE') }}</span>
                                            }
                                        </td>
                                        <td>
                                            @if (v.statutValidation === 'VALIDE' && v.numeroQuittance) {
                                                <span class="fv-quittance">{{ v.numeroQuittance }}</span>
                                            } @else if (v.statutValidation === 'REJETE' && v.motifRejet) {
                                                <div class="fv-motif-rejet">{{ v.motifRejet }}</div>
                                            } @else {
                                                <span class="fv-quittance">—</span>
                                            }
                                        </td>
                                        <td>
                                            <span [class]="statutClass(v.statutValidation)">{{ t('finances.versements.statuts.' + v.statutValidation) }}</span>
                                            @if (v.statutValidation === 'EN_ATTENTE_VALIDATION' && v.modePaiement === 'VALIDATION_BANCAIRE') {
                                                <div class="fv-en-attente-info">{{ t('finances.versements.enAttenteInfo') }}</div>
                                            }
                                        </td>
                                        <td>
                                            @if (v.statutValidation === 'VALIDE') {
                                                <button class="fv-pdf-btn" [class.loading]="downloadingId() === v.id"
                                                    (click)="onDownloadPdf(v)"
                                                    [attr.aria-label]="t('finances.versements.telechargerPdf')">
                                                    @if (downloadingId() === v.id) {
                                                        <i class="pi pi-spin pi-spinner"></i>
                                                    } @else {
                                                        <i class="pi pi-file-pdf"></i>
                                                    }
                                                    PDF
                                                </button>
                                            }
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                }
            </div>
        }

    </ng-container>
    `
})
export class Versements {
    private eleveService   = inject(EleveService);
    private financesSvc    = inject(FinancesService);
    private transloco      = inject(TranslocoService);

    @ViewChild('montantRef') montantRef!: ElementRef<HTMLDivElement>;

    searchQuery = '';
    montant: number | null = null;

    readonly selectedEleve  = signal<EleveResponse | null>(null);
    readonly eleveResults   = signal<EleveResponse[]>([]);
    readonly searchLoading  = signal(false);
    readonly didSearch      = signal(false);
    readonly solde          = signal<SoldeResponse | null>(null);
    readonly loadingSolde   = signal(false);
    readonly history        = signal<{ content: VersementResponse[]; totalElements: number }>({ content: [], totalElements: 0 });
    readonly loadingHist    = signal(false);
    readonly saving         = signal(false);
    readonly showErrors     = signal(false);
    readonly feedbackError  = signal<string | null>(null);
    readonly feedbackSuccess = signal<string | null>(null);
    readonly downloadingId  = signal<string | null>(null);

    private searchTimer: ReturnType<typeof setTimeout> | null = null;
    private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

    onSearchChange(): void {
        this.didSearch.set(false);
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.doSearch(), 350);
    }

    private doSearch(): void {
        const q = this.searchQuery.trim();
        if (q.length < 2) { this.eleveResults.set([]); return; }
        const isMatricule = /^[A-Z]{1,4}-\d{4}-/i.test(q);
        this.searchLoading.set(true);
        this.eleveService.rechercher(isMatricule ? { matricule: q } : { nom: q }, 0, 10).subscribe({
            next: res => { this.eleveResults.set(res.content); this.didSearch.set(true); this.searchLoading.set(false); },
            error: () => this.searchLoading.set(false)
        });
    }

    selectEleve(e: EleveResponse): void {
        this.selectedEleve.set(e);
        this.eleveResults.set([]); this.didSearch.set(false); this.searchQuery = '';
        this.loadSolde(e.id); this.loadHistory(e.id);
    }

    clearEleve(): void {
        this.selectedEleve.set(null); this.solde.set(null);
        this.history.set({ content: [], totalElements: 0 });
        this.showErrors.set(false); this.feedbackError.set(null);
        this.feedbackSuccess.set(null); this.montant = null;
    }

    private loadSolde(id: string): void {
        this.loadingSolde.set(true);
        this.financesSvc.getSolde(id).subscribe({
            next: s => { this.solde.set(s); this.loadingSolde.set(false); },
            error: () => this.loadingSolde.set(false)
        });
    }

    private loadHistory(id: string): void {
        this.loadingHist.set(true);
        this.financesSvc.getVersementsEleve(id, 0, 50).subscribe({
            next: page => { this.history.set({ content: page.content, totalElements: page.totalElements }); this.loadingHist.set(false); },
            error: () => this.loadingHist.set(false)
        });
    }

    onSave(): void {
        this.showErrors.set(true);
        const eleve = this.selectedEleve();
        if (!eleve || !this.montant || this.montant <= 0) return;
        this.saving.set(true); this.feedbackError.set(null); this.feedbackSuccess.set(null);
        this.financesSvc.creerVersement({ eleveId: eleve.id, montant: this.montant, modePaiement: 'CAISSE' }).subscribe({
            next: () => {
                this.saving.set(false); this.showErrors.set(false); this.montant = null;
                this.loadSolde(eleve.id); this.loadHistory(eleve.id);
                this.setFeedback('success', this.transloco.translate('app.finances.versements.enregistreSucces'));
                setTimeout(() => {
                    const inp = this.montantRef?.nativeElement?.querySelector('input') as HTMLInputElement;
                    inp?.focus();
                }, 100);
            },
            error: err => {
                this.saving.set(false);
                const msg = err?.error?.message ?? null;
                this.setFeedback('error', typeof msg === 'string' ? msg : this.transloco.translate('app.finances.versements.erreurEnregistrement'));
            }
        });
    }

    onDownloadPdf(v: VersementResponse): void {
        this.downloadingId.set(v.id);
        this.financesSvc.downloadQuittancePdf(v.id).subscribe({
            next: blob => {
                this.downloadingId.set(null);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `quittance-${v.numeroQuittance}.pdf`;
                a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
            },
            error: () => {
                this.downloadingId.set(null);
                this.setFeedback('error', this.transloco.translate('app.finances.versements.erreurPdf'));
            }
        });
    }

    private setFeedback(type: 'success' | 'error', msg: string): void {
        if (type === 'success') { this.feedbackSuccess.set(msg); this.feedbackError.set(null); }
        else { this.feedbackError.set(msg); this.feedbackSuccess.set(null); }
        if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
        this.feedbackTimer = setTimeout(() => { this.feedbackSuccess.set(null); this.feedbackError.set(null); }, 4000);
    }

    statutClass(s: string): string {
        if (s === 'VALIDE') return 'fv-stat-valid';
        if (s === 'EN_ATTENTE_VALIDATION') return 'fv-stat-wait';
        return 'fv-stat-reject';
    }

    formatFcfa(v: number): string {
        return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
    }

    formatDate(iso: string): string {
        return iso.slice(0, 16).replace('T', ' ');
    }
}
