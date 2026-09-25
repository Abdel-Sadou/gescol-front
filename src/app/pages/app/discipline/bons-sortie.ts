import {
    ChangeDetectionStrategy, Component, inject, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { EleveService, EleveResponse } from '@/app/core/services/eleve.service';
import { AuthService } from '@/app/core/services/auth.service';
import { DisciplineService, BonSortieResponse } from '@/app/core/services/discipline.service';

@Component({
    selector: 'app-bons-sortie',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, InputTextModule, MessageModule, SkeletonModule
    ],
    styles: [`
        :host { display: block; padding: 28px; max-width: 960px; }

        /* ── En-tête page ── */
        .bs-header { display: flex; align-items: center; gap: 18px; margin-bottom: 28px; }
        .bs-header-icon {
            width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
            background: #fffbeb; border: 1px solid #fde68a;
            display: flex; align-items: center; justify-content: center;
        }
        .bs-header-icon i { font-size: 24px; color: #d97706; }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 3px; color: var(--color-text); }
        .bs-sub { font-size: 14px; color: var(--color-text-muted); margin: 0; }

        /* ── Cartes ── */
        .bs-card {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.05);
            padding: 24px; margin-bottom: 16px;
        }
        .bs-card-accent { border-top: 3px solid var(--color-primary); }
        h2 { font-size: 15px; font-weight: 700; margin: 0 0 18px; color: var(--color-text);
              display: flex; align-items: center; gap: 8px; }
        .bs-card-icon {
            width: 28px; height: 28px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            background: var(--color-primary-soft);
        }
        .bs-card-icon i { font-size: 13px; color: var(--color-primary); }

        /* ── Recherche élève ── */
        .bs-search-wrap { display: flex; flex-direction: column; gap: 8px; max-width: 480px; }
        .bs-results {
            max-height: 210px; overflow-y: auto;
            border: 1px solid var(--color-border); border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,.08);
        }
        .bs-result-row {
            padding: 11px 16px; cursor: pointer; font-size: 13px;
            border-bottom: 1px solid var(--color-border);
            display: flex; justify-content: space-between; align-items: center;
            transition: background .12s;
        }
        .bs-result-row:last-child { border-bottom: 0; }
        .bs-result-row:hover { background: var(--color-primary-soft); }
        .bs-matricule { font-family: monospace; font-size: 11px; color: var(--color-text-muted); }
        .bs-no-result {
            padding: 14px 16px; font-size: 13px; color: var(--color-text-muted);
            text-align: center; display: flex; align-items: center; justify-content: center; gap: 7px;
        }

        /* ── Banner élève sélectionné ── */
        .bs-banner {
            background: var(--color-primary-soft); border: 1px solid var(--color-primary);
            border-radius: 10px; padding: 12px 18px; margin-bottom: 0;
            display: flex; justify-content: space-between; align-items: center;
        }
        .bs-banner-name { font-weight: 700; color: var(--color-primary); font-size: 14px; }
        .bs-banner-sub { font-size: 12px; color: var(--color-primary); opacity: .75; margin-top: 2px; }

        /* ── Formulaire ── */
        .bs-form-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .bs-form-group { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 200px; }
        .bs-form-group-full { display: flex; flex-direction: column; gap: 5px; margin-bottom: 16px; }
        .bs-label { font-size: 13px; font-weight: 600; color: var(--color-text); }
        .bs-req { color: var(--color-danger); }
        .bs-dt-input {
            padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 8px;
            font-family: inherit; font-size: 14px; color: var(--color-text);
            background: var(--color-surface); width: 100%; box-sizing: border-box;
            transition: border-color .15s;
        }
        .bs-dt-input:focus { outline: none; border-color: var(--color-primary);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent); }
        .bs-textarea {
            width: 100%; min-height: 80px; resize: vertical;
            padding: 9px 12px; border: 1px solid var(--color-border); border-radius: 8px;
            font-family: inherit; font-size: 14px; color: var(--color-text);
            background: var(--color-surface); box-sizing: border-box; transition: border-color .15s;
        }
        .bs-textarea:focus { outline: none; border-color: var(--color-primary);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent); }
        .bs-input-error { border-color: var(--color-danger) !important; }
        .bs-field-error { font-size: 12px; color: var(--color-danger); }
        .bs-form-actions { display: flex; justify-content: flex-end; margin-top: 4px; }

        /* ── Table historique ── */
        .bs-table-wrap { border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
            background: var(--color-surface-alt); padding: 10px 14px;
            text-align: left; font-weight: 700; font-size: 11px;
            text-transform: uppercase; letter-spacing: .5px; color: var(--color-text-muted);
            border-bottom: 1px solid var(--color-border);
        }
        tbody tr { border-bottom: 1px solid var(--color-border); transition: background .1s; }
        tbody tr:last-child { border-bottom: 0; }
        tbody tr:hover { background: var(--color-surface-alt); }
        tbody td { padding: 10px 14px; color: var(--color-text); vertical-align: middle; }
        .bs-td-date { white-space: nowrap; font-family: monospace; font-size: 12px; color: var(--color-text-muted); width: 130px; }
        .bs-td-motif { }
        .bs-motif-text { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 340px; }

        /* ── Badges statut ── */
        .bs-badge-sorti  { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;
            border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700;
            display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
        .bs-badge-rentre { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;
            border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700;
            display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
        .bs-retour-date { font-size: 11px; color: var(--color-text-muted);
            font-family: monospace; display: block; margin-top: 4px; }

        /* ── Confirmation inline ── */
        .bs-statut-cell { min-width: 240px; }
        .bs-sorti-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .bs-confirm-wrap {
            display: flex; align-items: center; gap: 7px;
            background: #fefce8; border: 1px solid #fde68a;
            border-radius: 7px; padding: 5px 10px;
            font-size: 12px; color: #854d0e; font-weight: 600;
        }
        .bs-btn-yes, .bs-btn-no {
            width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; transition: background .12s;
        }
        .bs-btn-yes { background: #dcfce7; color: #166534; }
        .bs-btn-yes:hover:not(:disabled) { background: #bbf7d0; }
        .bs-btn-no  { background: #fee2e2; color: #dc2626; }
        .bs-btn-no:hover  { background: #fecaca; }
        .bs-valider-btn {
            font-size: 12px; font-weight: 600; cursor: pointer;
            background: none; border: 1px solid #a3e635; color: #365314;
            border-radius: 7px; padding: 5px 12px;
            display: inline-flex; align-items: center; gap: 5px; transition: background .12s;
        }
        .bs-valider-btn:hover:not(:disabled) { background: #f7fee7; }
        .bs-valider-btn:disabled { opacity: .5; cursor: default; }

        /* ── États vides ── */
        .bs-empty {
            padding: 32px 16px; text-align: center; color: var(--color-text-muted); font-size: 13px;
            display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .bs-empty i { font-size: 28px; opacity: .35; }
        .bs-feedback-top { margin-bottom: 14px; }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <!-- ── En-tête page ── -->
        <div class="bs-header">
            <div class="bs-header-icon"><i class="pi pi-directions"></i></div>
            <div>
                <h1>{{ t('discipline.bonsSortie.titre') }}</h1>
                <p class="bs-sub">{{ t('discipline.bonsSortie.sousTitre') }}</p>
            </div>
        </div>

        <!-- ── Recherche / Banner élève ── -->
        <div class="bs-card">
            @if (!selectedEleve()) {
                <h2>
                    <span class="bs-card-icon"><i class="pi pi-search"></i></span>
                    {{ t('discipline.bonsSortie.rechercheEleve') }}
                </h2>
                <div class="bs-search-wrap">
                    <input pInputText
                        [(ngModel)]="searchQuery"
                        [placeholder]="t('discipline.bonsSortie.recherchePlaceholder')"
                        (ngModelChange)="onSearchChange()"
                        style="width:100%">
                    @if (searchQuery.length > 0 && searchQuery.length < 2) {
                        <small style="color:var(--color-text-muted);font-size:12px;margin-top:-2px">
                            {{ t('discipline.commun.miniCaracteres') }}
                        </small>
                    }

                    @if (searchLoading()) {
                        <div class="bs-results">
                            @for (i of [1,2,3]; track i) {
                                <div class="bs-result-row">
                                    <p-skeleton width="220px" height="14px"></p-skeleton>
                                    <p-skeleton width="70px" height="12px"></p-skeleton>
                                </div>
                            }
                        </div>
                    } @else if (didSearch() && eleveResults().length === 0) {
                        <div class="bs-results">
                            <div class="bs-no-result">
                                <i class="pi pi-search" style="opacity:.4"></i>
                                {{ t('discipline.bonsSortie.aucunResultat') }}
                            </div>
                        </div>
                    } @else if (eleveResults().length > 0) {
                        <div class="bs-results">
                            @for (e of eleveResults(); track e.id) {
                                <div class="bs-result-row" (click)="selectEleve(e)">
                                    <span>{{ e.prenom }} {{ e.nom }} — {{ e.classeLibelle }}</span>
                                    <span class="bs-matricule">{{ e.matricule }}</span>
                                </div>
                            }
                        </div>
                    }
                </div>
            } @else {
                <div class="bs-banner">
                    <div>
                        <div class="bs-banner-name">{{ selectedEleve()!.prenom }} {{ selectedEleve()!.nom }}</div>
                        <div class="bs-banner-sub">{{ selectedEleve()!.classeLibelle }} · {{ selectedEleve()!.matricule }}</div>
                    </div>
                    <p-button severity="secondary" size="small"
                        [label]="t('discipline.bonsSortie.changerEleve')"
                        icon="pi pi-times"
                        (onClick)="clearEleve()">
                    </p-button>
                </div>
            }
        </div>

        @if (selectedEleve()) {

            <!-- ── Carte 1 : Nouveau bon (EN PREMIER) ── -->
            <div class="bs-card bs-card-accent">
                <h2>
                    <span class="bs-card-icon"><i class="pi pi-plus"></i></span>
                    {{ t('discipline.bonsSortie.nouveauBon') }}
                </h2>

                <div class="bs-form-group-full">
                    <label class="bs-label">{{ t('discipline.bonsSortie.motif') }} <span class="bs-req">*</span></label>
                    <textarea class="bs-textarea"
                        [(ngModel)]="motif"
                        rows="3"
                        [class.bs-input-error]="showErrors() && !motif.trim()"
                        [placeholder]="t('discipline.bonsSortie.motifPlaceholder')">
                    </textarea>
                    @if (showErrors() && !motif.trim()) {
                        <small class="bs-field-error">{{ t('parametrage.commun.requis') }}</small>
                    }
                </div>

                <div class="bs-form-group" style="max-width:320px;margin-bottom:16px">
                    <label class="bs-label">{{ t('discipline.bonsSortie.dateSortie') }} <span class="bs-req">*</span></label>
                    <input type="datetime-local"
                        class="bs-dt-input"
                        [class.bs-input-error]="showErrors() && !dateSortie"
                        [(ngModel)]="dateSortie">
                </div>

                @if (createError()) {
                    <p-message severity="error" [text]="createError()!" styleClass="mb-3"></p-message>
                }
                @if (createSuccess()) {
                    <p-message severity="success" [text]="t('discipline.bonsSortie.emis')" styleClass="mb-3"></p-message>
                }

                <div class="bs-form-actions">
                    <p-button
                        [label]="t('discipline.bonsSortie.emettre')"
                        icon="pi pi-send"
                        severity="primary"
                        [loading]="creating()"
                        [disabled]="creating()"
                        (onClick)="onCreerBon()">
                    </p-button>
                </div>
            </div>

            <!-- ── Carte 2 : Historique (EN DESSOUS) ── -->
            <div class="bs-card">
                <h2>
                    <span class="bs-card-icon"><i class="pi pi-list"></i></span>
                    {{ t('discipline.bonsSortie.historique') }}
                </h2>

                @if (retourSuccess()) {
                    <div class="bs-feedback-top">
                        <p-message severity="success" [text]="t('discipline.bonsSortie.retourValide')"></p-message>
                    </div>
                }
                @if (retourError()) {
                    <div class="bs-feedback-top">
                        <p-message severity="error" [text]="retourError()!"></p-message>
                    </div>
                }

                @if (loadingBons()) {
                    <p-skeleton height="120px" borderRadius="8px"></p-skeleton>
                } @else if (bonsList().length === 0) {
                    <div class="bs-empty">
                        <i class="pi pi-inbox"></i>
                        {{ t('discipline.bonsSortie.aucunBon') }}
                    </div>
                } @else {
                    <div class="bs-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width:130px">{{ t('discipline.bonsSortie.colDateSortie') }}</th>
                                    <th>{{ t('discipline.bonsSortie.colMotif') }}</th>
                                    <th>{{ t('discipline.bonsSortie.colStatut') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (bon of bonsList(); track bon.id) {
                                    <tr>
                                        <td class="bs-td-date">{{ formatDatetime(bon.dateSortie) }}</td>
                                        <td class="bs-td-motif" [title]="bon.motif">
                                            <span class="bs-motif-text">{{ bon.motif }}</span>
                                        </td>
                                        <td class="bs-statut-cell">
                                            @if (bon.statut === 'SORTI') {
                                                <div class="bs-sorti-row">
                                                    <span class="bs-badge-sorti">
                                                        <i class="pi pi-arrow-right"></i>
                                                        {{ t('discipline.bonsSortie.statutSorti') }}
                                                    </span>
                                                    @if (confirmRetourId() === bon.id) {
                                                        <span class="bs-confirm-wrap">
                                                            {{ t('discipline.bonsSortie.confirmerQuestion') }}
                                                            <button class="bs-btn-yes"
                                                                [disabled]="validatingId() !== null"
                                                                (click)="onValiderRetour(bon)"
                                                                [title]="t('discipline.bonsSortie.confirmerOui')">
                                                                <i class="pi pi-check"></i>
                                                            </button>
                                                            <button class="bs-btn-no"
                                                                (click)="confirmRetourId.set(null)"
                                                                [title]="t('discipline.bonsSortie.confirmerNon')">
                                                                <i class="pi pi-times"></i>
                                                            </button>
                                                        </span>
                                                    } @else {
                                                        <button class="bs-valider-btn"
                                                            [disabled]="validatingId() !== null"
                                                            (click)="confirmRetourId.set(bon.id)">
                                                            <i class="pi pi-sign-in"></i>
                                                            {{ t('discipline.bonsSortie.validerRetour') }}
                                                        </button>
                                                    }
                                                </div>
                                            } @else {
                                                <div>
                                                    <span class="bs-badge-rentre">
                                                        <i class="pi pi-check"></i>
                                                        {{ t('discipline.bonsSortie.statutRentre') }}
                                                    </span>
                                                    @if (bon.dateEntree) {
                                                        <span class="bs-retour-date">{{ formatDatetime(bon.dateEntree) }}</span>
                                                    }
                                                </div>
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
export class BonsSortie {
    private eleveService      = inject(EleveService);
    private authService       = inject(AuthService);
    private disciplineService = inject(DisciplineService);
    private transloco         = inject(TranslocoService);

    searchQuery = '';
    motif       = '';
    dateSortie  = this.nowDatetimeLocal();

    readonly selectedEleve   = signal<EleveResponse | null>(null);
    readonly eleveResults    = signal<EleveResponse[]>([]);
    readonly searchLoading   = signal(false);
    readonly didSearch       = signal(false);
    readonly bonsList        = signal<BonSortieResponse[]>([]);
    readonly loadingBons     = signal(false);
    readonly creating        = signal(false);
    readonly showErrors      = signal(false);
    readonly createError     = signal<string | null>(null);
    readonly createSuccess   = signal(false);
    readonly validatingId    = signal<string | null>(null);
    readonly confirmRetourId = signal<string | null>(null);
    readonly retourSuccess   = signal(false);
    readonly retourError     = signal<string | null>(null);

    private searchTimer: ReturnType<typeof setTimeout> | null = null;
    private successTimer: ReturnType<typeof setTimeout> | null = null;

    onSearchChange(): void {
        this.didSearch.set(false);
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.searchEleves(), 350);
    }

    private searchEleves(): void {
        const q = this.searchQuery.trim();
        if (q.length < 2) { this.eleveResults.set([]); return; }
        const isMatricule = /^[A-Z]{1,4}-\d{4}-/i.test(q);
        this.searchLoading.set(true);
        this.eleveService.rechercher(isMatricule ? { matricule: q } : { nom: q }, 0, 10).subscribe({
            next: res => {
                this.eleveResults.set(res.content);
                this.didSearch.set(true);
                this.searchLoading.set(false);
            },
            error: () => this.searchLoading.set(false)
        });
    }

    selectEleve(e: EleveResponse): void {
        this.selectedEleve.set(e);
        this.eleveResults.set([]);
        this.didSearch.set(false);
        this.searchQuery = '';
        this.confirmRetourId.set(null);
        this.loadBons(e.id);
    }

    clearEleve(): void {
        this.selectedEleve.set(null);
        this.bonsList.set([]);
        this.showErrors.set(false);
        this.createError.set(null);
        this.createSuccess.set(false);
        this.retourSuccess.set(false);
        this.retourError.set(null);
        this.confirmRetourId.set(null);
        this.motif = '';
        this.dateSortie = this.nowDatetimeLocal();
    }

    private loadBons(eleveId: string): void {
        this.loadingBons.set(true);
        this.disciplineService.getBonsSortieByEleve(eleveId).subscribe({
            next: list => {
                this.bonsList.set([...list].sort((a, b) => b.dateSortie.localeCompare(a.dateSortie)));
                this.loadingBons.set(false);
            },
            error: () => this.loadingBons.set(false)
        });
    }

    onCreerBon(): void {
        this.showErrors.set(true);
        const eleve = this.selectedEleve();
        if (!eleve || !this.motif.trim() || !this.dateSortie) return;
        const utilisateurId = this.authService.currentUser()?.utilisateurId;
        if (!utilisateurId) {
            this.createError.set(this.transloco.translate('app.discipline.bonsSortie.erreurAutorise'));
            return;
        }
        this.creating.set(true);
        this.createError.set(null);
        this.createSuccess.set(false);
        this.disciplineService.creerBonSortie({
            eleveId:       eleve.id,
            dateSortie:    this.datetimeLocalToISO(this.dateSortie),
            motif:         this.motif.trim(),
            autoriseParId: utilisateurId
        }).subscribe({
            next: bon => {
                this.creating.set(false);
                this.createSuccess.set(true);
                this.showErrors.set(false);
                this.motif = '';
                this.dateSortie = this.nowDatetimeLocal();
                this.bonsList.update(list => [bon, ...list]);
                if (this.successTimer) clearTimeout(this.successTimer);
                this.successTimer = setTimeout(() => this.createSuccess.set(false), 4000);
            },
            error: err => {
                this.creating.set(false);
                const msg = err?.error?.message ?? null;
                this.createError.set(typeof msg === 'string' ? msg :
                    this.transloco.translate('app.discipline.bonsSortie.erreurCreation'));
            }
        });
    }

    onValiderRetour(bon: BonSortieResponse): void {
        this.confirmRetourId.set(null);
        this.validatingId.set(bon.id);
        this.retourError.set(null);
        this.retourSuccess.set(false);
        this.disciplineService.validerRetour(bon.id).subscribe({
            next: updated => {
                this.validatingId.set(null);
                this.retourSuccess.set(true);
                this.bonsList.update(list => list.map(b => b.id === updated.id ? updated : b));
                if (this.successTimer) clearTimeout(this.successTimer);
                this.successTimer = setTimeout(() => this.retourSuccess.set(false), 4000);
            },
            error: err => {
                this.validatingId.set(null);
                const msg = err?.error?.message ?? null;
                this.retourError.set(typeof msg === 'string' ? msg :
                    this.transloco.translate('app.discipline.bonsSortie.erreurRetour'));
            }
        });
    }

    formatDatetime(iso: string): string { return iso?.slice(0, 16).replace('T', ' ') ?? ''; }
    private nowDatetimeLocal(): string {
        const d = new Date(), pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    private datetimeLocalToISO(v: string): string { return v.length === 16 ? `${v}:00` : v; }
}
