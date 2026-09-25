import {
    ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import {
    FinancesService, VersementsClasseResponse, TotauxResponse
} from '@/app/core/services/finances.service';
import { ParametrageService, ClasseResponse } from '@/app/core/services/parametrage.service';

interface ClasseOption { id: string; libelle: string; }

interface EleveClasse extends VersementsClasseResponse {
    tauxPct: number;
}

@Component({
    selector: 'app-etats',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, DatePickerModule, SelectModule, MessageModule, SkeletonModule
    ],
    styles: [`
        :host {
            display: block; padding: 28px; max-width: 1060px;
            --c-ok-fg: #166534; --c-ok-bg: #f0fdf4; --c-ok-bd: #bbf7d0;
            --c-blue-fg: #1e40af; --c-blue-bg: #eff6ff; --c-blue-bd: #bfdbfe;
        }
        /* ── Header ── */
        .et-header { display: flex; align-items: center; gap: 18px; margin-bottom: 28px; }
        .et-header-icon {
            width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
            background: var(--c-blue-bg); border: 1px solid var(--c-blue-bd);
            display: flex; align-items: center; justify-content: center;
        }
        .et-header-icon i { font-size: 24px; color: var(--c-blue-fg); }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 3px; color: var(--color-text); }
        .et-sub { font-size: 14px; color: var(--color-text-muted); margin: 0; }
        /* ── Feedback ── */
        .et-feedback { margin-bottom: 16px; }
        /* ── Tabs ── */
        .et-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--color-border); margin-bottom: 24px; }
        .et-tab {
            padding: 10px 24px; font-size: 13px; font-weight: 600; cursor: pointer;
            color: var(--color-text-muted); border-bottom: 2px solid transparent;
            margin-bottom: -2px; transition: all .15s; background: none;
            border-top: 0; border-left: 0; border-right: 0;
        }
        .et-tab.active { color: var(--c-blue-fg); border-bottom-color: var(--c-blue-fg); }
        /* ── Cards ── */
        .et-card {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.05);
            padding: 22px 24px; margin-bottom: 20px;
        }
        h2 { font-size: 14px; font-weight: 700; margin: 0 0 16px; color: var(--color-text);
             display: flex; align-items: center; gap: 8px; }
        /* ── Filtre barre ── */
        .et-filter-bar { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }
        .et-form-group { display: flex; flex-direction: column; gap: 5px; }
        .et-label { font-size: 12px; font-weight: 600; color: var(--color-text-muted);
            text-transform: uppercase; letter-spacing: .4px; }
        /* ── Table ── */
        .et-table-wrap { margin-top: 18px; border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
            background: var(--color-surface-alt); padding: 10px 14px; text-align: left;
            font-weight: 700; font-size: 10px; text-transform: uppercase;
            letter-spacing: .5px; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border);
        }
        thead th.right { text-align: right; }
        tbody tr { border-bottom: 1px solid var(--color-border); transition: background .1s; }
        tbody tr:last-child { border-bottom: 0; }
        tbody tr:hover { background: var(--color-surface-alt); }
        tbody td { padding: 10px 14px; color: var(--color-text); vertical-align: middle; }
        .td-right { text-align: right; }
        .td-mono { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }
        .td-bold { font-weight: 700; }
        /* ── Taux badge ── */
        .taux-badge {
            display: inline-block; border-radius: 6px; padding: 2px 8px;
            font-size: 11px; font-weight: 700;
        }
        .taux-ok { background: var(--c-ok-bg); color: var(--c-ok-fg); border: 1px solid var(--c-ok-bd); }
        .taux-mid { background: #fffbeb; color: #78350f; border: 1px solid #f59e0b; }
        .taux-low { background: #fef2f2; color: var(--color-danger); border: 1px solid #fecaca; }
        /* ── Tfoot ── */
        tfoot td {
            padding: 11px 14px; font-weight: 800; font-size: 13px;
            border-top: 2px solid var(--color-border);
            background: linear-gradient(to bottom, var(--color-surface-alt), var(--color-surface));
            color: var(--color-text);
        }
        tfoot td.label-cell { font-weight: 800; color: var(--color-text-muted); text-transform: uppercase;
            font-size: 10px; letter-spacing: .5px; }
        tfoot td.total-ok { color: var(--c-ok-fg); }
        tfoot td.total-danger { color: var(--color-danger); }
        /* ── Résultats période ── */
        .et-totaux-grid {
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 18px;
        }
        .et-totaux-cell {
            background: var(--color-surface-alt); border: 1px solid var(--color-border);
            border-radius: 10px; padding: 16px 18px; position: relative; overflow: hidden;
        }
        .et-totaux-cell::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .et-totaux-cell.versement::before { background: var(--c-ok-fg); }
        .et-totaux-cell.nombre::before { background: var(--c-blue-fg); }
        .et-totaux-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            letter-spacing: .6px; color: var(--color-text-muted); margin-bottom: 8px;
        }
        .et-totaux-value { font-size: 24px; font-weight: 900; color: var(--color-text); }
        .et-totaux-value.ok { color: var(--c-ok-fg); }
        .et-totaux-value.blue { color: var(--c-blue-fg); }
        /* ── Empty ── */
        .et-empty { padding: 40px; text-align: center; color: var(--color-text-muted);
            display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 13px; }
        .et-empty i { font-size: 32px; opacity: .3; }
        /* ── Date error ── */
        .et-date-error {
            background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;
            padding: 8px 12px; font-size: 12px; color: var(--color-danger);
            display: flex; align-items: center; gap: 6px; margin-top: 8px;
        }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <div class="et-header">
            <div class="et-header-icon"><i class="pi pi-chart-bar" aria-hidden="true"></i></div>
            <div>
                <h1>{{ t('finances.etats.titre') }}</h1>
                <p class="et-sub">{{ t('finances.etats.sousTitre') }}</p>
            </div>
        </div>

        <!-- Feedback -->
        @if (errorMsg()) {
            <div class="et-feedback"><p-message severity="error" [text]="errorMsg()!"></p-message></div>
        }

        <!-- Tabs -->
        <div class="et-tabs" role="tablist">
            <button class="et-tab" [class.active]="activeTab() === 'classe'"
                role="tab" [attr.aria-selected]="activeTab() === 'classe'"
                (click)="activeTab.set('classe')">
                {{ t('finances.etats.ongletClasse') }}
            </button>
            <button class="et-tab" [class.active]="activeTab() === 'periode'"
                role="tab" [attr.aria-selected]="activeTab() === 'periode'"
                (click)="activeTab.set('periode')">
                {{ t('finances.etats.ongletPeriode') }}
            </button>
        </div>

        <!-- Tab : Par classe -->
        @if (activeTab() === 'classe') {
            <div class="et-card">
                <div class="et-filter-bar">
                    <div class="et-form-group" style="min-width:260px">
                        <label class="et-label">{{ t('finances.etats.classe') }}</label>
                        <p-select [(ngModel)]="selectedClasseId" [options]="classes()"
                            optionLabel="libelle" optionValue="id"
                            [placeholder]="t('finances.etats.classePlaceholder')"
                            [filter]="true" filterBy="libelle"
                            [loading]="loadingClasses()"
                            style="width:100%"
                            [attr.aria-label]="t('finances.etats.classe')">
                        </p-select>
                    </div>
                    <p-button [label]="t('finances.etats.afficher')" icon="pi pi-search"
                        [disabled]="!selectedClasseId" [loading]="loadingClasse()"
                        (onClick)="loadClasse()"
                        [attr.aria-label]="t('finances.etats.afficher')">
                    </p-button>
                </div>

                @if (loadingClasse()) {
                    <p-skeleton height="200px" borderRadius="8px" style="margin-top:18px"></p-skeleton>
                } @else if (classeData().length > 0) {
                    <div class="et-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>{{ t('finances.etats.colEleve') }}</th>
                                    <th>{{ t('finances.etats.colMatricule') }}</th>
                                    <th class="right">{{ t('finances.etats.colScolarite') }}</th>
                                    <th class="right">{{ t('finances.etats.colVerse') }}</th>
                                    <th class="right">{{ t('finances.etats.colSolde') }}</th>
                                    <th class="right">{{ t('finances.etats.colTaux') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (r of classeData(); track r.eleveId) {
                                    <tr>
                                        <td class="td-bold">{{ r.prenom }} {{ r.nom }}</td>
                                        <td class="td-mono">{{ r.matricule }}</td>
                                        <td class="td-right">{{ formatFcfa(r.montantScolarite) }}</td>
                                        <td class="td-right td-bold" [style.color]="r.totalVerse > 0 ? 'var(--c-ok-fg)' : 'inherit'">
                                            {{ formatFcfa(r.totalVerse) }}
                                        </td>
                                        <td class="td-right" [style.color]="r.soldeRestant > 0 ? 'var(--color-danger)' : 'var(--c-ok-fg)'">
                                            {{ formatFcfa(r.soldeRestant) }}
                                        </td>
                                        <td class="td-right">
                                            <span class="taux-badge" [class]="tauxClass(r.tauxPct)">{{ r.tauxPct }}%</span>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td class="label-cell" colspan="2">{{ t('finances.etats.total') }}</td>
                                    <td class="td-right">{{ formatFcfa(totalScolarite()) }}</td>
                                    <td class="td-right total-ok">{{ formatFcfa(totalVerse()) }}</td>
                                    <td class="td-right total-danger">{{ formatFcfa(totalSolde()) }}</td>
                                    <td class="td-right">
                                        <span class="taux-badge" [class]="tauxClass(tauxGlobal())">{{ tauxGlobal() }}%</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                } @else if (hasSearchedClasse()) {
                    <div class="et-empty"><i class="pi pi-inbox"></i>{{ t('finances.etats.aucunEleve') }}</div>
                }
            </div>
        }

        <!-- Tab : Par période -->
        @if (activeTab() === 'periode') {
            <div class="et-card">
                <div class="et-filter-bar">
                    <div class="et-form-group">
                        <label class="et-label">{{ t('finances.etats.dateDebut') }}</label>
                        <p-datepicker [(ngModel)]="dateDebut" dateFormat="dd/mm/yy"
                            [showIcon]="true" [maxDate]="dateFin ?? undefined"
                            style="width:170px"
                            [attr.aria-label]="t('finances.etats.dateDebut')">
                        </p-datepicker>
                    </div>
                    <div class="et-form-group">
                        <label class="et-label">{{ t('finances.etats.dateFin') }}</label>
                        <p-datepicker [(ngModel)]="dateFin" dateFormat="dd/mm/yy"
                            [showIcon]="true" [minDate]="dateDebut ?? undefined"
                            style="width:170px"
                            [attr.aria-label]="t('finances.etats.dateFin')">
                        </p-datepicker>
                    </div>
                    <p-button [label]="t('finances.etats.calculer')" icon="pi pi-calculator"
                        [disabled]="!dateDebut || !dateFin" [loading]="loadingPeriode()"
                        (onClick)="loadPeriode()"
                        [attr.aria-label]="t('finances.etats.calculer')">
                    </p-button>
                </div>

                @if (dateError()) {
                    <div class="et-date-error">
                        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                        {{ t('finances.etats.erreurDates') }}
                    </div>
                }

                @if (loadingPeriode()) {
                    <p-skeleton height="120px" borderRadius="8px" style="margin-top:18px"></p-skeleton>
                } @else if (periodeData()) {
                    <div class="et-totaux-grid">
                        <div class="et-totaux-cell versement">
                            <div class="et-totaux-label">{{ t('finances.etats.totalVerse') }}</div>
                            <div class="et-totaux-value" [class.ok]="periodeData()!.totalVerse > 0">
                                {{ formatFcfa(periodeData()!.totalVerse) }}
                            </div>
                        </div>
                        <div class="et-totaux-cell nombre">
                            <div class="et-totaux-label">{{ t('finances.etats.nombreVersements') }}</div>
                            <div class="et-totaux-value blue">{{ periodeData()!.nombreVersements }}</div>
                        </div>
                    </div>
                }
            </div>
        }

    </ng-container>
    `
})
export class Etats implements OnInit {
    private financesSvc    = inject(FinancesService);
    private parametrageSvc = inject(ParametrageService);
    private transloco      = inject(TranslocoService);

    selectedClasseId: string = '';
    dateDebut: Date | null = null;
    dateFin: Date | null   = null;

    readonly classes         = signal<ClasseOption[]>([]);
    readonly loadingClasses  = signal(true);
    readonly classeData      = signal<EleveClasse[]>([]);
    readonly loadingClasse   = signal(false);
    readonly hasSearchedClasse = signal(false);
    readonly periodeData     = signal<TotauxResponse | null>(null);
    readonly loadingPeriode  = signal(false);
    readonly activeTab       = signal<'classe' | 'periode'>('classe');
    readonly errorMsg        = signal<string | null>(null);
    readonly dateError       = signal(false);

    readonly totalScolarite = (): number => this.classeData().reduce((s, r) => s + r.montantScolarite, 0);
    readonly totalVerse = (): number => this.classeData().reduce((s, r) => s + r.totalVerse, 0);
    readonly totalSolde = (): number => this.classeData().reduce((s, r) => s + r.soldeRestant, 0);
    readonly tauxGlobal = (): number => {
        const ts = this.totalScolarite();
        return ts === 0 ? 0 : Math.round(this.totalVerse() / ts * 100);
    };

    ngOnInit(): void { this.loadClasses(); }

    private loadClasses(): void {
        this.parametrageSvc.getClasses(0, 200).subscribe({
            next: page => {
                this.classes.set(page.content.map((c: ClasseResponse) => ({ id: c.id, libelle: c.libelle })));
                this.loadingClasses.set(false);
            },
            error: () => this.loadingClasses.set(false)
        });
    }

    loadClasse(): void {
        if (!this.selectedClasseId) return;
        this.loadingClasse.set(true); this.errorMsg.set(null);
        this.financesSvc.getVersementsClasse(this.selectedClasseId).subscribe({
            next: list => {
                this.classeData.set(list.map(r => ({
                    ...r,
                    tauxPct: r.montantScolarite === 0 ? 0 : Math.round(r.totalVerse / r.montantScolarite * 100)
                })));
                this.hasSearchedClasse.set(true); this.loadingClasse.set(false);
            },
            error: () => {
                this.loadingClasse.set(false);
                this.errorMsg.set(this.transloco.translate('app.finances.etats.erreurChargement'));
            }
        });
    }

    loadPeriode(): void {
        this.dateError.set(false);
        if (!this.dateDebut || !this.dateFin) return;
        if (this.dateFin < this.dateDebut) { this.dateError.set(true); return; }
        this.loadingPeriode.set(true); this.errorMsg.set(null);
        this.financesSvc.getTotaux(this.formatDateISO(this.dateDebut), this.formatDateISO(this.dateFin)).subscribe({
            next: data => { this.periodeData.set(data); this.loadingPeriode.set(false); },
            error: () => {
                this.loadingPeriode.set(false);
                this.errorMsg.set(this.transloco.translate('app.finances.etats.erreurChargement'));
            }
        });
    }

    tauxClass(pct: number): string {
        if (pct >= 80) return 'taux-ok';
        if (pct >= 40) return 'taux-mid';
        return 'taux-low';
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
