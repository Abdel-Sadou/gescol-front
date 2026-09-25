import {
    ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { EleveService, EleveResponse } from '@/app/core/services/eleve.service';
import {
    FinancesService, MoratoireResponse, SoldeResponse, StatutMoratoire
} from '@/app/core/services/finances.service';

@Component({
    selector: 'app-moratoires',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, DatePickerModule, SelectModule, InputTextModule, MessageModule,
        SkeletonModule, TextareaModule
    ],
    styles: [`
        :host {
            display: block; padding: 28px; max-width: 1040px;
            --c-ok-fg: #166534; --c-ok-bg: #f0fdf4; --c-ok-bd: #bbf7d0;
            --c-warn-fg: #92400e; --c-warn-bg: #fffbeb; --c-warn-bd: #f59e0b;
            --c-purple-fg: #6d28d9; --c-purple-bg: #f5f3ff; --c-purple-bd: #ddd6fe;
        }
        /* ── Header ── */
        .mo-header { display: flex; align-items: center; gap: 18px; margin-bottom: 28px; }
        .mo-header-icon {
            width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
            background: var(--c-purple-bg); border: 1px solid var(--c-purple-bd);
            display: flex; align-items: center; justify-content: center;
        }
        .mo-header-icon i { font-size: 24px; color: var(--c-purple-fg); }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 3px; color: var(--color-text); }
        .mo-sub { font-size: 14px; color: var(--color-text-muted); margin: 0; }
        /* ── Feedback ── */
        .mo-feedback { margin-bottom: 16px; }
        /* ── Cards ── */
        .mo-card {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.05);
            padding: 22px 24px; margin-bottom: 20px;
        }
        .mo-card-accent { border-top: 3px solid var(--c-purple-fg); }
        h2 { font-size: 14px; font-weight: 700; margin: 0 0 16px; color: var(--color-text);
             display: flex; align-items: center; gap: 8px; }
        /* ── Recherche ── */
        .mo-search-wrap { display: flex; flex-direction: column; gap: 8px; max-width: 480px; margin-bottom: 14px; }
        .mo-results {
            max-height: 200px; overflow-y: auto;
            border: 1px solid var(--color-border); border-radius: 8px;
            box-shadow: 0 4px 14px rgba(0,0,0,.09);
        }
        .mo-result-row {
            padding: 10px 14px; cursor: pointer; font-size: 13px;
            border-bottom: 1px solid var(--color-border);
            display: flex; justify-content: space-between; align-items: center;
        }
        .mo-result-row:last-child { border-bottom: 0; }
        .mo-result-row:hover { background: var(--c-purple-bg); }
        .mo-result-name { font-weight: 600; }
        .mo-result-meta { font-size: 11px; color: var(--color-text-muted); text-align: right; }
        .mo-no-result {
            padding: 14px; font-size: 13px; color: var(--color-text-muted);
            text-align: center;
        }
        /* ── Banner élève sélectionné ── */
        .mo-eleve-banner {
            background: var(--c-purple-bg); border: 1px solid var(--c-purple-bd);
            border-radius: 10px; padding: 12px 16px;
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 14px;
        }
        .mo-eleve-name { font-weight: 700; color: var(--color-text); font-size: 15px; }
        .mo-eleve-meta { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
        /* ── Mini solde sous l'élève ── */
        .mo-solde-mini {
            background: var(--color-surface-alt); border: 1px solid var(--color-border);
            border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;
            display: flex; align-items: center; gap: 16px; font-size: 13px;
        }
        .mo-solde-mini-item { display: flex; flex-direction: column; gap: 2px; }
        .mo-solde-mini-label { font-size: 10px; font-weight: 700; text-transform: uppercase;
            letter-spacing: .4px; color: var(--color-text-muted); }
        .mo-solde-mini-val { font-weight: 700; font-size: 14px; }
        .mo-solde-mini-val.danger { color: var(--color-danger); }
        .mo-solde-mini-val.ok { color: var(--c-ok-fg); }
        /* ── Form grid ── */
        .mo-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .mo-form-group { display: flex; flex-direction: column; gap: 5px; }
        .mo-label { font-size: 13px; font-weight: 600; color: var(--color-text); }
        .mo-req { color: var(--color-danger); }
        .mo-hint { font-size: 11px; color: var(--color-text-muted); font-style: italic; }
        .mo-form-footer { display: flex; justify-content: flex-end; margin-top: 18px; }
        /* ── Tabs ── */
        .mo-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--color-border);
            margin-bottom: 16px; }
        .mo-tab {
            padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer;
            color: var(--color-text-muted); border-bottom: 2px solid transparent;
            margin-bottom: -2px; transition: all .15s; background: none; border-top: 0;
            border-left: 0; border-right: 0;
        }
        .mo-tab.active { color: var(--c-purple-fg); border-bottom-color: var(--c-purple-fg); }
        .mo-tab-badge {
            margin-left: 6px; min-width: 18px; height: 18px; border-radius: 9px; padding: 0 5px;
            background: var(--c-purple-fg); color: #fff; font-size: 10px; font-weight: 700;
            display: inline-flex; align-items: center; justify-content: center;
        }
        /* ── Filtre historique ── */
        .mo-filtre-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        /* ── Table ── */
        .mo-table-wrap { border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
            background: var(--color-surface-alt); padding: 9px 13px; text-align: left;
            font-weight: 700; font-size: 10px; text-transform: uppercase;
            letter-spacing: .5px; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border);
        }
        tbody tr { border-bottom: 1px solid var(--color-border); transition: background .1s; }
        tbody tr:last-child { border-bottom: 0; }
        tbody tr:hover { background: var(--color-surface-alt); }
        tbody td { padding: 10px 13px; color: var(--color-text); vertical-align: middle; }
        /* ── Inline confirmation ── */
        .mo-confirm-row {
            background: #fffbeb; border-top: 1px solid var(--c-warn-bd);
            padding: 10px 13px; display: flex; align-items: center; gap: 10px; font-size: 13px;
        }
        .mo-confirm-q { font-weight: 600; color: var(--c-warn-fg); flex: 1; }
        /* ── Badges ── */
        .badge-redoublant {
            background: #fef3c7; color: #78350f; border: 1px solid #f59e0b;
            border-radius: 5px; padding: 1px 6px; font-size: 10px; font-weight: 700;
            margin-left: 6px; white-space: nowrap;
        }
        .st-attente { background: var(--c-warn-bg); color: var(--c-warn-fg); border: 1px solid var(--c-warn-bd);
            border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .st-valide { background: var(--c-ok-bg); color: var(--c-ok-fg); border: 1px solid var(--c-ok-bd);
            border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .st-refuse { background: #fef2f2; color: var(--color-danger); border: 1px solid #fecaca;
            border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        /* ── Motif tronqué ── */
        .mo-motif { max-width: 200px; overflow: hidden; text-overflow: ellipsis;
            white-space: nowrap; font-style: italic; color: var(--color-text-muted); font-size: 12px; }
        /* ── Date mono ── */
        .mo-date { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }
        /* ── Empty ── */
        .mo-empty { padding: 40px 16px; text-align: center; color: var(--color-text-muted);
            font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .mo-empty i { font-size: 32px; opacity: .3; }
        /* ── Boutons actions inline ── */
        .mo-action-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 12px;
            font-weight: 600; padding: 4px 10px; border-radius: 6px; cursor: pointer;
            border: 1px solid; transition: all .12s; background: none; }
        .mo-action-ok { color: var(--c-ok-fg); border-color: var(--c-ok-bd); }
        .mo-action-ok:hover { background: var(--c-ok-bg); }
        .mo-action-ko { color: var(--color-danger); border-color: #fecaca; }
        .mo-action-ko:hover { background: #fef2f2; }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <div class="mo-header">
            <div class="mo-header-icon"><i class="pi pi-calendar-clock" aria-hidden="true"></i></div>
            <div>
                <h1>{{ t('finances.moratoires.titre') }}</h1>
                <p class="mo-sub">{{ t('finances.moratoires.sousTitre') }}</p>
            </div>
        </div>

        <!-- Feedback global -->
        @if (successMsg()) {
            <div class="mo-feedback"><p-message severity="success" [text]="successMsg()!"></p-message></div>
        }
        @if (errorMsg()) {
            <div class="mo-feedback"><p-message severity="error" [text]="errorMsg()!"></p-message></div>
        }

        <!-- Formulaire (pleine largeur en haut) -->
        <div class="mo-card mo-card-accent">
            <h2><i class="pi pi-plus-circle" aria-hidden="true"></i> {{ t('finances.moratoires.formulaireTitre') }}</h2>

            <!-- Recherche élève -->
            <div class="mo-search-wrap">
                @if (!selectedEleve()) {
                    <input pInputText [(ngModel)]="searchQuery"
                        [placeholder]="t('finances.moratoires.rechercherEleve')"
                        (ngModelChange)="onSearchChange()" style="width:100%"
                        [attr.aria-label]="t('finances.moratoires.rechercherEleve')">

                    @if (searchLoading()) {
                        <div class="mo-results">
                            @for (i of [1,2]; track i) { <div class="mo-result-row"><div>…</div></div> }
                        </div>
                    } @else if (didSearch() && eleveResults().length === 0) {
                        <div class="mo-results"><div class="mo-no-result">{{ t('finances.moratoires.aucunEleve') }}</div></div>
                    } @else if (eleveResults().length > 0) {
                        <div class="mo-results" role="listbox">
                            @for (e of eleveResults(); track e.id) {
                                <div class="mo-result-row" role="option" tabindex="0"
                                    (click)="selectEleve(e)" (keydown.enter)="selectEleve(e)">
                                    <span class="mo-result-name">{{ e.prenom }} {{ e.nom }}</span>
                                    <div class="mo-result-meta">
                                        <div>{{ e.matricule }}</div>
                                        <div>{{ e.classeLibelle }}</div>
                                    </div>
                                </div>
                            }
                        </div>
                    }
                } @else {
                    <div class="mo-eleve-banner">
                        <div>
                            <div class="mo-eleve-name">{{ selectedEleve()!.prenom }} {{ selectedEleve()!.nom }}</div>
                            <div class="mo-eleve-meta">{{ selectedEleve()!.classeLibelle }} · {{ selectedEleve()!.matricule }}</div>
                        </div>
                        <p-button severity="secondary" size="small" icon="pi pi-times"
                            [label]="t('finances.moratoires.changerEleve')"
                            (onClick)="clearEleve()"></p-button>
                    </div>

                    <!-- Mini solde de l'élève -->
                    @if (loadingSolde()) {
                        <p-skeleton height="46px" borderRadius="8px"></p-skeleton>
                    } @else if (solde()) {
                        <div class="mo-solde-mini">
                            <div class="mo-solde-mini-item">
                                <span class="mo-solde-mini-label">{{ t('finances.moratoires.scolarite') }}</span>
                                <span class="mo-solde-mini-val">{{ formatFcfa(solde()!.tauxScolarite) }}</span>
                            </div>
                            <div class="mo-solde-mini-item">
                                <span class="mo-solde-mini-label">{{ t('finances.moratoires.verse') }}</span>
                                <span class="mo-solde-mini-val ok">{{ formatFcfa(solde()!.totalVerse) }}</span>
                            </div>
                            <div class="mo-solde-mini-item">
                                <span class="mo-solde-mini-label">{{ t('finances.moratoires.soldeRestant') }}</span>
                                <span class="mo-solde-mini-val" [class.danger]="solde()!.soldeRestant > 0" [class.ok]="solde()!.soldeRestant === 0">
                                    {{ formatFcfa(solde()!.soldeRestant) }}
                                </span>
                            </div>
                        </div>
                    }
                }
            </div>

            <!-- Champs du formulaire (seulement si élève sélectionné) -->
            @if (selectedEleve()) {
                <div class="mo-form-grid">
                    <div class="mo-form-group">
                        <label class="mo-label">{{ t('finances.moratoires.dateProposee') }} <span class="mo-req">*</span></label>
                        <p-datepicker [(ngModel)]="dateProposee" dateFormat="dd/mm/yy"
                            [minDate]="today" [showIcon]="true"
                            [placeholder]="t('finances.moratoires.datePlaceholder')"
                            [class.p-invalid]="showErrors() && !dateProposee"
                            style="width:100%">
                        </p-datepicker>
                        <span class="mo-hint">{{ t('finances.moratoires.suggestionDate') }}</span>
                        @if (showErrors() && !dateProposee) {
                            <small style="font-size:12px;color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="mo-form-group">
                        <label class="mo-label">{{ t('finances.moratoires.motif') }}</label>
                        <textarea pTextarea [(ngModel)]="motif" rows="3"
                            [placeholder]="t('finances.moratoires.motifPlaceholder')"
                            style="width:100%;resize:vertical"></textarea>
                    </div>
                </div>
                <div class="mo-form-footer">
                    <p-button [label]="t('finances.moratoires.soumettre')" icon="pi pi-send"
                        [loading]="submitting()" (onClick)="onSubmit()"
                        [attr.aria-label]="t('finances.moratoires.soumettre')"></p-button>
                </div>
            }
        </div>

        <!-- Onglets liste -->
        <div class="mo-card" style="padding:20px 24px">
            <div class="mo-tabs" role="tablist">
                <button class="mo-tab" [class.active]="activeTab() === 'attente'"
                    role="tab" [attr.aria-selected]="activeTab() === 'attente'"
                    (click)="activeTab.set('attente')">
                    {{ t('finances.moratoires.ongletAttente') }}
                    @if (enAttente().length > 0) {
                        <span class="mo-tab-badge">{{ enAttente().length }}</span>
                    }
                </button>
                <button class="mo-tab" [class.active]="activeTab() === 'historique'"
                    role="tab" [attr.aria-selected]="activeTab() === 'historique'"
                    (click)="loadHistorique()">
                    {{ t('finances.moratoires.ongletHistorique') }}
                </button>
            </div>

            <!-- Tab : En attente -->
            @if (activeTab() === 'attente') {
                @if (loadingAttente()) {
                    <p-skeleton height="100px" borderRadius="8px"></p-skeleton>
                } @else if (enAttente().length === 0) {
                    <div class="mo-empty"><i class="pi pi-check-circle"></i>{{ t('finances.moratoires.aucuneAttente') }}</div>
                } @else {
                    <div class="mo-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>{{ t('finances.moratoires.colEleve') }}</th>
                                    <th>{{ t('finances.moratoires.colDateProposee') }}</th>
                                    <th>{{ t('finances.moratoires.colMotif') }}</th>
                                    <th style="width:180px">{{ t('finances.moratoires.colActions') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (m of enAttente(); track m.id) {
                                    <tr>
                                        <td>
                                            <div style="font-weight:600">
                                                {{ m.elevePrenom }} {{ m.eleveNom }}
                                                @if (m.eleveRedoublant) {
                                                    <span class="badge-redoublant" [title]="t('finances.moratoires.redoublantInfo')">
                                                        {{ t('finances.moratoires.redoublant') }}
                                                    </span>
                                                }
                                            </div>
                                            <div class="mo-date">{{ m.eleveMatricule }}</div>
                                        </td>
                                        <td class="mo-date">{{ m.dateProposee }}</td>
                                        <td>
                                            @if (m.motif) {
                                                <span class="mo-motif" [title]="m.motif">{{ m.motif }}</span>
                                            } @else { <span style="color:var(--color-text-muted)">—</span> }
                                        </td>
                                        <td>
                                            @if (confirmValId() !== m.id && confirmRefId() !== m.id) {
                                                <div style="display:flex;gap:6px">
                                                    <button class="mo-action-btn mo-action-ok"
                                                        (click)="confirmValId.set(m.id)"
                                                        [attr.aria-label]="t('finances.moratoires.valider')">
                                                        <i class="pi pi-check" aria-hidden="true"></i>
                                                        {{ t('finances.moratoires.valider') }}
                                                    </button>
                                                    <button class="mo-action-btn mo-action-ko"
                                                        (click)="confirmRefId.set(m.id)"
                                                        [attr.aria-label]="t('finances.moratoires.refuser')">
                                                        <i class="pi pi-times" aria-hidden="true"></i>
                                                        {{ t('finances.moratoires.refuser') }}
                                                    </button>
                                                </div>
                                            }
                                        </td>
                                    </tr>
                                    @if (confirmValId() === m.id) {
                                        <tr>
                                            <td colspan="4" style="padding:0">
                                                <div class="mo-confirm-row">
                                                    <span class="mo-confirm-q">{{ t('finances.moratoires.confirmValider') }}</span>
                                                    <p-button size="small" severity="success" icon="pi pi-check"
                                                        [label]="t('finances.moratoires.oui')"
                                                        [loading]="actionId() === m.id"
                                                        (onClick)="valider(m)"></p-button>
                                                    <p-button size="small" severity="secondary" [outlined]="true"
                                                        [label]="t('commun.annuler')"
                                                        (onClick)="confirmValId.set(null)"></p-button>
                                                </div>
                                            </td>
                                        </tr>
                                    }
                                    @if (confirmRefId() === m.id) {
                                        <tr>
                                            <td colspan="4" style="padding:0">
                                                <div class="mo-confirm-row">
                                                    <span class="mo-confirm-q">{{ t('finances.moratoires.confirmRefuser') }}</span>
                                                    <p-button size="small" severity="danger" icon="pi pi-times"
                                                        [label]="t('finances.moratoires.oui')"
                                                        [loading]="actionId() === m.id"
                                                        (onClick)="refuser(m)"></p-button>
                                                    <p-button size="small" severity="secondary" [outlined]="true"
                                                        [label]="t('commun.annuler')"
                                                        (onClick)="confirmRefId.set(null)"></p-button>
                                                </div>
                                            </td>
                                        </tr>
                                    }
                                }
                            </tbody>
                        </table>
                    </div>
                }
            }

            <!-- Tab : Historique -->
            @if (activeTab() === 'historique') {
                <div class="mo-filtre-bar">
                    <p-select [(ngModel)]="filtreStatut" [options]="statutOptions"
                        optionLabel="label" optionValue="value"
                        [placeholder]="t('finances.moratoires.tousStatuts')"
                        [showClear]="true" style="width:200px"
                        (onChange)="loadHistorique()"
                        [attr.aria-label]="t('finances.moratoires.filtreStatut')">
                    </p-select>
                </div>

                @if (loadingHisto()) {
                    <p-skeleton height="100px" borderRadius="8px"></p-skeleton>
                } @else if (historique().length === 0) {
                    <div class="mo-empty"><i class="pi pi-inbox"></i>{{ t('finances.moratoires.aucunHistorique') }}</div>
                } @else {
                    <div class="mo-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>{{ t('finances.moratoires.colEleve') }}</th>
                                    <th>{{ t('finances.moratoires.colDemande') }}</th>
                                    <th>{{ t('finances.moratoires.colDateProposee') }}</th>
                                    <th>{{ t('finances.moratoires.colMotif') }}</th>
                                    <th>{{ t('finances.moratoires.colStatut') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (m of historique(); track m.id) {
                                    <tr>
                                        <td>
                                            <div style="font-weight:600">{{ m.elevePrenom }} {{ m.eleveNom }}</div>
                                            <div class="mo-date">{{ m.eleveMatricule }}</div>
                                        </td>
                                        <td class="mo-date">{{ m.dateDemande }}</td>
                                        <td class="mo-date">{{ m.dateProposee }}</td>
                                        <td>
                                            @if (m.motif) {
                                                <span class="mo-motif" [title]="m.motif">{{ m.motif }}</span>
                                            } @else { <span style="color:var(--color-text-muted)">—</span> }
                                        </td>
                                        <td><span [class]="statutClass(m.statut)">{{ t('finances.moratoires.statuts.' + m.statut) }}</span></td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                }
            }
        </div>

    </ng-container>
    `
})
export class Moratoires implements OnInit {
    private eleveService = inject(EleveService);
    private financesSvc  = inject(FinancesService);
    private transloco    = inject(TranslocoService);

    searchQuery = '';
    dateProposee: Date | null = null;
    motif = '';
    filtreStatut: StatutMoratoire | null = null;

    readonly today = new Date();

    readonly selectedEleve   = signal<EleveResponse | null>(null);
    readonly eleveResults    = signal<EleveResponse[]>([]);
    readonly searchLoading   = signal(false);
    readonly didSearch       = signal(false);
    readonly solde           = signal<SoldeResponse | null>(null);
    readonly loadingSolde    = signal(false);
    readonly enAttente       = signal<MoratoireResponse[]>([]);
    readonly historique      = signal<MoratoireResponse[]>([]);
    readonly loadingAttente  = signal(true);
    readonly loadingHisto    = signal(false);
    readonly submitting      = signal(false);
    readonly showErrors      = signal(false);
    readonly actionId        = signal<string | null>(null);
    readonly confirmValId    = signal<string | null>(null);
    readonly confirmRefId    = signal<string | null>(null);
    readonly successMsg      = signal<string | null>(null);
    readonly errorMsg        = signal<string | null>(null);
    readonly activeTab       = signal<'attente' | 'historique'>('attente');

    readonly statutOptions = [
        { label: 'En attente', value: 'EN_ATTENTE' as StatutMoratoire },
        { label: 'Validé',     value: 'VALIDE'     as StatutMoratoire },
        { label: 'Refusé',     value: 'REFUSE'     as StatutMoratoire }
    ];

    private searchTimer: ReturnType<typeof setTimeout> | null = null;
    private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

    ngOnInit(): void {
        const j30 = new Date(); j30.setDate(j30.getDate() + 30);
        this.dateProposee = j30;
        this.loadEnAttente();
    }

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
        this.loadSolde(e.id);
    }

    clearEleve(): void {
        this.selectedEleve.set(null); this.solde.set(null);
    }

    private loadSolde(id: string): void {
        this.loadingSolde.set(true);
        this.financesSvc.getSolde(id).subscribe({
            next: s => { this.solde.set(s); this.loadingSolde.set(false); },
            error: () => this.loadingSolde.set(false)
        });
    }

    loadEnAttente(): void {
        this.loadingAttente.set(true);
        this.financesSvc.getMoratoriesEnAttente().subscribe({
            next: list => { this.enAttente.set(list); this.loadingAttente.set(false); },
            error: () => this.loadingAttente.set(false)
        });
    }

    loadHistorique(): void {
        this.activeTab.set('historique');
        this.loadingHisto.set(true);
        const statut = this.filtreStatut ?? undefined;
        this.financesSvc.getHistoriqueMoratoires(statut).subscribe({
            next: list => { this.historique.set(list); this.loadingHisto.set(false); },
            error: () => this.loadingHisto.set(false)
        });
    }

    onSubmit(): void {
        this.showErrors.set(true);
        const eleve = this.selectedEleve();
        if (!eleve || !this.dateProposee) return;
        this.submitting.set(true); this.errorMsg.set(null);
        const dateStr = this.formatDateISO(this.dateProposee);
        this.financesSvc.creerMoratoire({ eleveId: eleve.id, dateProposee: dateStr, motif: this.motif.trim() || undefined }).subscribe({
            next: () => {
                this.submitting.set(false); this.showErrors.set(false);
                this.motif = ''; this.dateProposee = null;
                this.loadEnAttente();
                this.setFeedback('success', this.transloco.translate('app.finances.moratoires.soumisSucces'));
            },
            error: err => {
                this.submitting.set(false);
                const msg = err?.error?.message;
                this.setFeedback('error', typeof msg === 'string' ? msg :
                    this.transloco.translate('app.finances.moratoires.erreurSoumission'));
            }
        });
    }

    valider(m: MoratoireResponse): void {
        this.actionId.set(m.id); this.confirmValId.set(null);
        this.financesSvc.validerMoratoire(m.id).subscribe({
            next: () => {
                this.actionId.set(null);
                this.enAttente.update(l => l.filter(x => x.id !== m.id));
                this.setFeedback('success', this.transloco.translate('app.finances.moratoires.valideSucces',
                    { nom: m.elevePrenom + ' ' + m.eleveNom }));
            },
            error: err => {
                this.actionId.set(null);
                const msg = err?.error?.message;
                this.setFeedback('error', typeof msg === 'string' ? msg :
                    this.transloco.translate('app.finances.moratoires.erreurValidation'));
            }
        });
    }

    refuser(m: MoratoireResponse): void {
        this.actionId.set(m.id); this.confirmRefId.set(null);
        this.financesSvc.refuserMoratoire(m.id).subscribe({
            next: () => {
                this.actionId.set(null);
                this.enAttente.update(l => l.filter(x => x.id !== m.id));
                this.setFeedback('success', this.transloco.translate('app.finances.moratoires.refuseSucces',
                    { nom: m.elevePrenom + ' ' + m.eleveNom }));
            },
            error: err => {
                this.actionId.set(null);
                const msg = err?.error?.message;
                this.setFeedback('error', typeof msg === 'string' ? msg :
                    this.transloco.translate('app.finances.moratoires.erreurRefus'));
            }
        });
    }

    private setFeedback(type: 'success' | 'error', msg: string): void {
        if (type === 'success') { this.successMsg.set(msg); this.errorMsg.set(null); }
        else { this.errorMsg.set(msg); this.successMsg.set(null); }
        if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
        this.feedbackTimer = setTimeout(() => { this.successMsg.set(null); this.errorMsg.set(null); }, 4000);
    }

    statutClass(s: string): string {
        if (s === 'VALIDE') return 'st-valide';
        if (s === 'REFUSE') return 'st-refuse';
        return 'st-attente';
    }

    formatFcfa(v: number): string {
        return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
    }

    private formatDateISO(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
}
