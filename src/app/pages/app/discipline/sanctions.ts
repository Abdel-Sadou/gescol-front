import {
    ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { EleveService, EleveResponse } from '@/app/core/services/eleve.service';
import { ParametrageService } from '@/app/core/services/parametrage.service';
import { AuthService } from '@/app/core/services/auth.service';
import {
    DisciplineService, SanctionResponse, TypeSanction, ALL_TYPES_SANCTION
} from '@/app/core/services/discipline.service';

type Opt = { label: string; value: string };

function sanctionSev(type: TypeSanction): 'info' | 'warning' | 'danger' {
    if (['BLAME', 'RETARD'].includes(type)) return 'info';
    if (['ABSENCE_JUSTIFIEE', 'ABSENCE_NON_JUSTIFIEE', 'RETENUE', 'AVERTISSEMENT'].includes(type)) return 'warning';
    return 'danger';
}

@Component({
    selector: 'app-sanctions',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, SelectModule, InputTextModule, MessageModule, SkeletonModule
    ],
    styles: [`
        :host { display: block; padding: 28px; max-width: 1080px; }

        /* ── En-tête page ── */
        .sc-header { display: flex; align-items: center; gap: 18px; margin-bottom: 28px; }
        .sc-header-icon {
            width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
            background: #fef2f2; border: 1px solid #fecaca;
            display: flex; align-items: center; justify-content: center;
        }
        .sc-header-icon i { font-size: 24px; color: var(--color-danger); }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 3px; color: var(--color-text); }
        .sc-sub { font-size: 14px; color: var(--color-text-muted); margin: 0; }

        /* ── Cartes ── */
        .sc-card {
            background: var(--color-surface);
            border: 1px solid var(--color-border); border-radius: 12px;
            box-shadow: 0 1px 4px rgba(0,0,0,.05);
            padding: 24px; margin-bottom: 16px;
        }
        .sc-card-secondary { background: var(--color-surface-alt); box-shadow: none; }
        h2 { font-size: 15px; font-weight: 700; margin: 0 0 18px; color: var(--color-text);
              display: flex; align-items: center; gap: 8px; }
        .sc-card-icon { width: 28px; height: 28px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            background: var(--color-primary-soft); }
        .sc-card-icon i { font-size: 13px; color: var(--color-primary); }

        /* ── Recherche élève ── */
        .sc-search-wrap { display: flex; flex-direction: column; gap: 8px; max-width: 480px; }
        .sc-results {
            max-height: 210px; overflow-y: auto;
            border: 1px solid var(--color-border); border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,.08);
        }
        .sc-result-row {
            padding: 11px 16px; cursor: pointer; font-size: 13px;
            border-bottom: 1px solid var(--color-border);
            display: flex; justify-content: space-between; align-items: center;
            transition: background .12s;
        }
        .sc-result-row:last-child { border-bottom: 0; }
        .sc-result-row:hover { background: var(--color-primary-soft); }
        .sc-matricule { font-family: monospace; font-size: 11px; color: var(--color-text-muted); }
        .sc-no-result {
            padding: 14px 16px; font-size: 13px; color: var(--color-text-muted);
            text-align: center; display: flex; align-items: center; justify-content: center; gap: 7px;
        }

        /* ── Banner élève sélectionné ── */
        .sc-banner {
            background: var(--color-primary-soft); border: 1px solid var(--color-primary);
            border-radius: 10px; padding: 12px 18px; margin-bottom: 20px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .sc-banner-name { font-weight: 700; color: var(--color-primary); font-size: 14px; }
        .sc-banner-sub { font-size: 12px; color: var(--color-primary); opacity: .75; margin-top: 2px; }

        /* ── Formulaire ── */
        .sc-form-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .sc-form-group { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 200px; }
        .sc-form-group-full { margin-bottom: 16px; }
        .sc-label { font-size: 13px; font-weight: 600; color: var(--color-text); }
        .sc-req { color: var(--color-danger); }
        .sc-dt-input {
            padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 8px;
            font-family: inherit; font-size: 14px; color: var(--color-text);
            background: var(--color-surface); width: 100%; box-sizing: border-box;
            transition: border-color .15s;
        }
        .sc-dt-input:focus { outline: none; border-color: var(--color-primary);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent); }
        .sc-textarea {
            width: 100%; min-height: 90px; resize: vertical;
            padding: 9px 12px; border: 1px solid var(--color-border); border-radius: 8px;
            font-family: inherit; font-size: 14px; color: var(--color-text);
            background: var(--color-surface); box-sizing: border-box; transition: border-color .15s;
        }
        .sc-textarea:focus { outline: none; border-color: var(--color-primary);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent); }
        .sc-input-error { border-color: var(--color-danger) !important; }
        .sc-field-error { font-size: 12px; color: var(--color-danger); }
        .sc-form-actions { display: flex; justify-content: flex-end; margin-top: 4px; }

        /* ── Séparateur section ── */
        .sc-section-header {
            display: flex; align-items: center; gap: 10px;
            margin: 24px 0 14px; border-top: 1px solid var(--color-border); padding-top: 20px;
        }
        .sc-section-label {
            font-size: 11px; font-weight: 700; color: var(--color-text-muted);
            text-transform: uppercase; letter-spacing: .6px;
        }
        .sc-count-badge {
            min-width: 22px; height: 22px; border-radius: 11px; padding: 0 7px;
            background: var(--color-surface-alt); border: 1px solid var(--color-border);
            font-size: 11px; font-weight: 700; color: var(--color-text);
            display: inline-flex; align-items: center; justify-content: center;
        }

        /* ── Tables historique ── */
        .sc-table-wrap { border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
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
        .sc-td-date { white-space: nowrap; font-family: monospace; font-size: 12px; color: var(--color-text-muted); width: 130px; }
        .sc-td-motif { }
        .sc-motif-text {
            display: block; white-space: nowrap; overflow: hidden;
            text-overflow: ellipsis; max-width: 340px;
        }

        /* ── Badges type sanction ── */
        .sc-badge {
            border-radius: 6px; padding: 3px 9px; font-size: 11px;
            font-weight: 700; white-space: nowrap; display: inline-block;
        }
        .sc-badge-info    { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
        .sc-badge-warning { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
        .sc-badge-danger  { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .sc-badge-escalade{
            background: #fdf4ff; color: #7e22ce; border: 1px solid #e9d5ff;
            border-radius: 6px; padding: 3px 9px; font-size: 11px; font-weight: 700;
            display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
        }

        /* ── États vides ── */
        .sc-empty {
            padding: 32px 16px; text-align: center;
            color: var(--color-text-muted); font-size: 13px;
            display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .sc-empty i { font-size: 28px; opacity: .35; }

        /* ── Historique par classe (collapsible) ── */
        .sc-collapse { cursor: pointer; user-select: none; }
        .sc-collapse-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 16px 20px; border-radius: 10px;
            transition: background .12s;
        }
        .sc-collapse-header:hover { background: var(--color-surface-alt); }
        .sc-collapse-title { font-size: 14px; font-weight: 700; color: var(--color-text);
            display: flex; align-items: center; gap: 8px; }
        .sc-collapse-body { padding: 0 20px 20px; }
        .sc-classe-select { margin-bottom: 16px; }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <!-- ── En-tête ── -->
        <div class="sc-header">
            <div class="sc-header-icon"><i class="pi pi-shield"></i></div>
            <div>
                <h1>{{ t('discipline.sanctions.titre') }}</h1>
                <p class="sc-sub">{{ t('discipline.sanctions.sousTitre') }}</p>
            </div>
        </div>

        <!-- ── Carte 1 : Saisir une sanction ── -->
        <div class="sc-card">
            <h2>
                <span class="sc-card-icon"><i class="pi pi-pen-to-square"></i></span>
                {{ t('discipline.sanctions.saisirTitre') }}
            </h2>

            @if (!selectedEleve()) {
                <!-- Recherche élève -->
                <div class="sc-search-wrap">
                    <input pInputText
                        [(ngModel)]="searchQuery"
                        [placeholder]="t('discipline.sanctions.recherchePlaceholder')"
                        (ngModelChange)="onSearchChange()"
                        style="width:100%">
                    @if (searchQuery.length > 0 && searchQuery.length < 2) {
                        <small style="color:var(--color-text-muted);font-size:12px;margin-top:-2px">
                            {{ t('discipline.commun.miniCaracteres') }}
                        </small>
                    }

                    @if (searchLoading()) {
                        <div class="sc-results">
                            @for (i of [1,2,3]; track i) {
                                <div class="sc-result-row">
                                    <p-skeleton width="220px" height="14px"></p-skeleton>
                                    <p-skeleton width="70px" height="12px"></p-skeleton>
                                </div>
                            }
                        </div>
                    } @else if (didSearch() && eleveResults().length === 0) {
                        <div class="sc-results">
                            <div class="sc-no-result">
                                <i class="pi pi-search" style="opacity:.4"></i>
                                {{ t('discipline.sanctions.aucunResultat') }}
                            </div>
                        </div>
                    } @else if (eleveResults().length > 0) {
                        <div class="sc-results">
                            @for (e of eleveResults(); track e.id) {
                                <div class="sc-result-row" (click)="selectEleve(e)">
                                    <span>{{ e.prenom }} {{ e.nom }} — {{ e.classeLibelle }}</span>
                                    <span class="sc-matricule">{{ e.matricule }}</span>
                                </div>
                            }
                        </div>
                    }
                </div>

            } @else {

                <!-- Banner élève sélectionné -->
                <div class="sc-banner">
                    <div>
                        <div class="sc-banner-name">{{ selectedEleve()!.prenom }} {{ selectedEleve()!.nom }}</div>
                        <div class="sc-banner-sub">{{ selectedEleve()!.classeLibelle }} · {{ selectedEleve()!.matricule }}</div>
                    </div>
                    <p-button severity="secondary" size="small"
                        [label]="t('discipline.sanctions.changerEleve')"
                        icon="pi pi-times"
                        (onClick)="clearEleve()">
                    </p-button>
                </div>

                <!-- ── Formulaire (EN PREMIER) ── -->
                <div class="sc-form-row">
                    <div class="sc-form-group">
                        <label class="sc-label">{{ t('discipline.sanctions.typeSanction') }} <span class="sc-req">*</span></label>
                        <p-select
                            [ngModel]="selectedType()"
                            (ngModelChange)="selectedType.set($event)"
                            [options]="typeSanctionOptions()"
                            optionLabel="label" optionValue="value"
                            [placeholder]="t('discipline.sanctions.choisirType')"
                            [class.p-invalid]="showErrors() && !selectedType()">
                        </p-select>
                        @if (showErrors() && !selectedType()) {
                            <small class="sc-field-error">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="sc-form-group">
                        <label class="sc-label">{{ t('discipline.sanctions.dateSanction') }} <span class="sc-req">*</span></label>
                        <input type="datetime-local"
                            class="sc-dt-input"
                            [class.sc-input-error]="showErrors() && !dateSanction"
                            [(ngModel)]="dateSanction">
                    </div>
                </div>

                <div class="sc-form-group-full">
                    <label class="sc-label">{{ t('discipline.sanctions.motif') }} <span class="sc-req">*</span></label>
                    <textarea class="sc-textarea"
                        [(ngModel)]="motif"
                        rows="3"
                        [class.sc-input-error]="showErrors() && !motif.trim()"
                        [placeholder]="t('discipline.sanctions.motifPlaceholder')">
                    </textarea>
                    @if (showErrors() && !motif.trim()) {
                        <small class="sc-field-error">{{ t('parametrage.commun.requis') }}</small>
                    }
                </div>

                @if (formError()) {
                    <p-message severity="error" [text]="formError()!" styleClass="mb-3"></p-message>
                }
                @if (saveSuccess()) {
                    <p-message severity="success" [text]="t('discipline.sanctions.enregistreAvecSucces')" styleClass="mb-3"></p-message>
                }

                <div class="sc-form-actions">
                    <p-button
                        [label]="t('discipline.sanctions.enregistrer')"
                        icon="pi pi-check"
                        severity="success"
                        [loading]="saving()"
                        [disabled]="saving()"
                        (onClick)="onSaveSanction()">
                    </p-button>
                </div>

                <!-- ── Historique (APRÈS le formulaire) ── -->
                <div class="sc-section-header">
                    <span class="sc-section-label">{{ t('discipline.sanctions.historiqueEleve') }}</span>
                    @if (!loadingHistory()) {
                        <span class="sc-count-badge">{{ eleveHistory().length }}</span>
                    }
                </div>

                @if (loadingHistory()) {
                    <p-skeleton height="90px" borderRadius="8px"></p-skeleton>
                } @else if (historyError()) {
                    <p-message severity="warn" [text]="t('discipline.sanctions.erreurChargement')"></p-message>
                } @else if (eleveHistory().length === 0) {
                    <div class="sc-empty">
                        <i class="pi pi-inbox"></i>
                        {{ t('discipline.sanctions.aucuneSanctionEleve') }}
                    </div>
                } @else {
                    <div class="sc-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width:130px">{{ t('discipline.sanctions.colDate') }}</th>
                                    <th style="width:170px">{{ t('discipline.sanctions.colType') }}</th>
                                    <th>{{ t('discipline.sanctions.colMotif') }}</th>
                                    <th style="width:150px"></th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (s of eleveHistory(); track s.id) {
                                    <tr>
                                        <td class="sc-td-date">{{ formatDatetime(s.dateSanction) }}</td>
                                        <td>
                                            <span [class]="'sc-badge sc-badge-' + sanctionSev(s.typeSanction)">
                                                {{ t('discipline.sanctions.types.' + s.typeSanction) }}
                                            </span>
                                        </td>
                                        <td class="sc-td-motif" [title]="s.motif">
                                            <span class="sc-motif-text">{{ s.motif }}</span>
                                        </td>
                                        <td>
                                            @if (s.genereParEscalade) {
                                                <span class="sc-badge-escalade">
                                                    <i class="pi pi-bolt"></i>
                                                    {{ t('discipline.sanctions.badgeEscalade') }}
                                                </span>
                                            }
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                }
            }
        </div>

        <!-- ── Carte 2 : Historique par classe (collapsible) ── -->
        <div class="sc-card sc-card-secondary">
            <div class="sc-collapse-header sc-collapse" (click)="showClasseHist.set(!showClasseHist())">
                <span class="sc-collapse-title">
                    <i class="pi pi-users" style="color:var(--color-text-muted)"></i>
                    {{ t('discipline.sanctions.historiqueClasse') }}
                </span>
                <i [class]="showClasseHist() ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                   style="color:var(--color-text-muted);font-size:13px"></i>
            </div>

            @if (showClasseHist()) {
                <div class="sc-collapse-body">
                    <div class="sc-classe-select">
                        <p-select
                            [ngModel]="selectedClasseId()"
                            (ngModelChange)="onClasseChange($event)"
                            [options]="classeOptions()"
                            optionLabel="label" optionValue="value"
                            [placeholder]="t('discipline.sanctions.choisirClasse')"
                            [loading]="loadingClasses()"
                            [showClear]="true"
                            [style]="{'width':'100%'}">
                        </p-select>
                    </div>

                    @if (!selectedClasseId() && !loadingClasseHist()) {
                        <div style="padding:18px 0;display:flex;align-items:center;gap:10px;color:var(--color-text-muted);font-size:13px">
                            <i class="pi pi-info-circle" style="font-size:16px;opacity:.5"></i>
                            {{ t('discipline.sanctions.historiqueClasseGuide') }}
                        </div>
                    }

                    @if (loadingClasseHist()) {
                        <p-skeleton height="120px" borderRadius="8px"></p-skeleton>
                    } @else if (selectedClasseId() && classeHistory().length === 0) {
                        <div class="sc-empty">
                            <i class="pi pi-inbox"></i>
                            {{ t('discipline.sanctions.aucuneSanctionClasse') }}
                        </div>
                    } @else if (classeHistory().length > 0) {
                        <div class="sc-table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width:130px">{{ t('discipline.sanctions.colDate') }}</th>
                                        <th>{{ t('discipline.sanctions.colEleve') }}</th>
                                        <th style="width:170px">{{ t('discipline.sanctions.colType') }}</th>
                                        <th>{{ t('discipline.sanctions.colMotif') }}</th>
                                        <th style="width:150px"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (s of classeHistory(); track s.id) {
                                        <tr>
                                            <td class="sc-td-date">{{ formatDatetime(s.dateSanction) }}</td>
                                            <td>
                                                {{ s.elevePrenom }} {{ s.eleveNom }}
                                                <br><span class="sc-matricule">{{ s.eleveMatricule }}</span>
                                            </td>
                                            <td>
                                                <span [class]="'sc-badge sc-badge-' + sanctionSev(s.typeSanction)">
                                                    {{ t('discipline.sanctions.types.' + s.typeSanction) }}
                                                </span>
                                            </td>
                                            <td class="sc-td-motif" [title]="s.motif">
                                                <span class="sc-motif-text">{{ s.motif }}</span>
                                            </td>
                                            <td>
                                                @if (s.genereParEscalade) {
                                                    <span class="sc-badge-escalade">
                                                        <i class="pi pi-bolt"></i>
                                                        {{ t('discipline.sanctions.badgeEscalade') }}
                                                    </span>
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
        </div>

    </ng-container>
    `
})
export class Sanctions implements OnInit {
    private eleveService      = inject(EleveService);
    private paramService      = inject(ParametrageService);
    private authService       = inject(AuthService);
    private disciplineService = inject(DisciplineService);
    private transloco         = inject(TranslocoService);
    private activeLang        = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });

    searchQuery  = '';
    motif        = '';
    dateSanction = this.nowDatetimeLocal();

    readonly selectedEleve     = signal<EleveResponse | null>(null);
    readonly eleveResults      = signal<EleveResponse[]>([]);
    readonly searchLoading     = signal(false);
    readonly didSearch         = signal(false);
    readonly eleveHistory      = signal<SanctionResponse[]>([]);
    readonly loadingHistory    = signal(false);
    readonly historyError      = signal(false);
    readonly selectedType      = signal<TypeSanction | null>(null);
    readonly saving            = signal(false);
    readonly showErrors        = signal(false);
    readonly formError         = signal<string | null>(null);
    readonly saveSuccess       = signal(false);
    readonly showClasseHist    = signal(false);
    readonly selectedClasseId  = signal<string | null>(null);
    readonly classeOptions     = signal<Opt[]>([]);
    readonly loadingClasses    = signal(false);
    readonly classeHistory     = signal<SanctionResponse[]>([]);
    readonly loadingClasseHist = signal(false);

    readonly typeSanctionOptions = computed(() => {
        this.activeLang();
        return ALL_TYPES_SANCTION.map(v => ({
            value: v,
            label: this.transloco.translate(`app.discipline.sanctions.types.${v}`)
        }));
    });

    private searchTimer: ReturnType<typeof setTimeout> | null = null;
    private successTimer: ReturnType<typeof setTimeout> | null = null;

    ngOnInit(): void {
        this.paramService.getClasses(0, 200).subscribe({
            next: res => {
                this.classeOptions.set(res.content.map(c => ({ value: c.id, label: c.libelle })));
                this.loadingClasses.set(false);
            },
            error: () => this.loadingClasses.set(false)
        });
    }

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
        this.loadEleveHistory(e.id);
    }

    clearEleve(): void {
        this.selectedEleve.set(null);
        this.eleveHistory.set([]);
        this.showErrors.set(false);
        this.formError.set(null);
        this.saveSuccess.set(false);
        this.selectedType.set(null);
        this.motif = '';
        this.dateSanction = this.nowDatetimeLocal();
    }

    private loadEleveHistory(eleveId: string): void {
        this.loadingHistory.set(true);
        this.historyError.set(false);
        this.disciplineService.getSanctionsByEleve(eleveId).subscribe({
            next: list => {
                this.eleveHistory.set([...list].sort((a, b) => b.dateSanction.localeCompare(a.dateSanction)));
                this.loadingHistory.set(false);
            },
            error: () => { this.historyError.set(true); this.loadingHistory.set(false); }
        });
    }

    onSaveSanction(): void {
        this.showErrors.set(true);
        const eleve = this.selectedEleve();
        const type  = this.selectedType();
        if (!eleve || !type || !this.motif.trim() || !this.dateSanction) return;

        this.saving.set(true);
        this.formError.set(null);
        this.saveSuccess.set(false);
        const utilisateurId = this.authService.currentUser()?.utilisateurId;
        this.disciplineService.creerSanction({
            eleveId:      eleve.id,
            typeSanction: type,
            dateSanction: this.datetimeLocalToISO(this.dateSanction),
            motif:        this.motif.trim(),
            ...(utilisateurId ? { enregistreParId: utilisateurId } : {})
        }).subscribe({
            next: () => {
                this.saving.set(false);
                this.saveSuccess.set(true);
                this.showErrors.set(false);
                this.selectedType.set(null);
                this.motif = '';
                this.dateSanction = this.nowDatetimeLocal();
                this.loadEleveHistory(eleve.id);
                if (this.successTimer) clearTimeout(this.successTimer);
                this.successTimer = setTimeout(() => this.saveSuccess.set(false), 4000);
            },
            error: err => {
                this.saving.set(false);
                const msg = err?.error?.message ?? null;
                this.formError.set(typeof msg === 'string' ? msg :
                    this.transloco.translate('app.discipline.sanctions.erreurEnregistrement'));
            }
        });
    }

    onClasseChange(id: string | null): void {
        this.selectedClasseId.set(id);
        this.classeHistory.set([]);
        if (!id) return;
        this.loadingClasseHist.set(true);
        this.disciplineService.getSanctionsByClasse(id).subscribe({
            next: list => {
                this.classeHistory.set([...list].sort((a, b) => b.dateSanction.localeCompare(a.dateSanction)));
                this.loadingClasseHist.set(false);
            },
            error: () => this.loadingClasseHist.set(false)
        });
    }

    sanctionSev = sanctionSev;

    formatDatetime(iso: string): string { return iso?.slice(0, 16).replace('T', ' ') ?? ''; }
    private nowDatetimeLocal(): string {
        const d = new Date(), pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    private datetimeLocalToISO(v: string): string { return v.length === 16 ? `${v}:00` : v; }
}
