import {
    ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { FinancesService, EleveEnRetardResponse } from '@/app/core/services/finances.service';
import { AuthService } from '@/app/core/services/auth.service';

type SortKey = 'classe' | 'solde';

@Component({
    selector: 'app-alertes',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, DialogModule, InputNumberModule, MessageModule, SkeletonModule
    ],
    styles: [`
        :host {
            display: block; padding: 28px; max-width: 1040px;
            --c-ok-fg: #166534; --c-ok-bg: #f0fdf4; --c-ok-bd: #bbf7d0;
            --c-danger-bg: #fef2f2; --c-danger-bd: #fecaca;
            --c-config-bg: #f8fafc; --c-config-bd: #e2e8f0;
        }
        /* ── Header ── */
        .al-header { display: flex; align-items: center; gap: 18px; margin-bottom: 24px; }
        .al-header-icon {
            width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
            background: var(--c-danger-bg); border: 1px solid var(--c-danger-bd);
            display: flex; align-items: center; justify-content: center;
        }
        .al-header-icon i { font-size: 24px; color: var(--color-danger); }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 3px; color: var(--color-text); }
        .al-sub { font-size: 14px; color: var(--color-text-muted); margin: 0; }
        /* ── Feedback ── */
        .al-feedback { margin-bottom: 16px; }
        /* ── Config seuil (collapsible) ── */
        .al-seuil-panel {
            background: var(--c-config-bg); border: 1px solid var(--c-config-bd);
            border-radius: 12px; margin-bottom: 20px; overflow: hidden;
        }
        .al-seuil-head {
            padding: 14px 20px; display: flex; align-items: center; gap: 10px;
            cursor: pointer; user-select: none;
        }
        .al-seuil-head i.si { color: var(--color-primary); }
        .al-seuil-head-title { font-size: 14px; font-weight: 700; color: var(--color-text); flex: 1; }
        .al-seuil-head-toggle { font-size: 11px; font-weight: 600; color: var(--color-primary); }
        .al-seuil-body { padding: 0 20px 18px; border-top: 1px solid var(--c-config-bd); }
        .al-seuil-row { display: flex; align-items: flex-end; gap: 14px; margin-top: 14px; }
        .al-form-group { display: flex; flex-direction: column; gap: 5px; }
        .al-label { font-size: 13px; font-weight: 600; color: var(--color-text); }
        /* ── Toolbar ── */
        .al-toolbar {
            display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
        }
        .al-toolbar-left { display: flex; align-items: center; gap: 10px; }
        .al-count { font-size: 22px; font-weight: 900; color: var(--color-danger); }
        .al-count-label { font-size: 13px; color: var(--color-text-muted); }
        .al-sort-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-text-muted); }
        .al-sort-btn { padding: 3px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;
            font-weight: 600; border: 1px solid; transition: all .12s; background: none; }
        .al-sort-btn.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
        .al-sort-btn:not(.active) { border-color: var(--color-border); color: var(--color-text-muted); }
        .al-sort-btn:not(.active):hover { background: var(--color-surface-alt); }
        /* ── Carte liste ── */
        .al-card {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.05);
        }
        .al-table-wrap { overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
            background: var(--color-surface-alt); padding: 10px 14px; text-align: left;
            font-weight: 700; font-size: 10px; text-transform: uppercase;
            letter-spacing: .5px; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border);
        }
        tbody tr { border-bottom: 1px solid var(--color-border); transition: background .1s; }
        tbody tr:last-child { border-bottom: 0; }
        tbody tr:hover { background: var(--c-danger-bg); }
        tbody td { padding: 10px 14px; color: var(--color-text); vertical-align: middle; }
        .al-mat { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }
        .al-solde { font-weight: 800; color: var(--color-danger); }
        /* ── Empty ── */
        .al-empty { padding: 52px 16px; text-align: center;
            display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .al-empty-icon {
            width: 64px; height: 64px; border-radius: 20px;
            background: var(--c-ok-bg); border: 1px solid var(--c-ok-bd);
            display: flex; align-items: center; justify-content: center;
        }
        .al-empty-icon i { font-size: 28px; color: var(--c-ok-fg); }
        .al-empty-title { font-size: 15px; font-weight: 700; color: var(--c-ok-fg); }
        .al-empty-sub { font-size: 13px; color: var(--color-text-muted); }
        /* ── Zone d'action danger (bas de page) ── */
        .al-danger-zone {
            margin-top: 24px; background: var(--c-danger-bg);
            border: 1px solid var(--c-danger-bd); border-radius: 12px;
            padding: 20px 24px; display: flex; align-items: center; gap: 20px;
        }
        .al-danger-zone-icon { width: 44px; height: 44px; border-radius: 12px;
            background: #fee2e2; border: 1px solid #fca5a5;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .al-danger-zone-icon i { font-size: 20px; color: var(--color-danger); }
        .al-danger-zone-text { flex: 1; }
        .al-danger-zone-title { font-size: 14px; font-weight: 700; color: var(--color-danger); margin-bottom: 3px; }
        .al-danger-zone-sub { font-size: 12px; color: #dc2626; opacity: .8; }
        /* ── Dialog ── */
        .dlg-notice {
            background: #fff7ed; border: 1px solid #fed7aa;
            border-radius: 8px; padding: 12px 14px; margin-bottom: 16px;
            font-size: 13px; color: #78350f; line-height: 1.5;
        }
        .dlg-notice i { margin-right: 6px; }
        .dlg-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <div class="al-header">
            <div class="al-header-icon"><i class="pi pi-bell" aria-hidden="true"></i></div>
            <div>
                <h1>{{ t('finances.alertes.titre') }}</h1>
                <p class="al-sub">{{ t('finances.alertes.sousTitre') }}</p>
            </div>
        </div>

        <!-- Feedback global -->
        @if (successMsg()) {
            <div class="al-feedback"><p-message severity="success" [text]="successMsg()!"></p-message></div>
        }
        @if (errorMsg()) {
            <div class="al-feedback"><p-message severity="error" [text]="errorMsg()!"></p-message></div>
        }

        <!-- Config seuil collapsible (ECONOMAT / SUPER_ADMIN seulement) -->
        @if (canConfigureSeuil()) {
            <div class="al-seuil-panel">
                <div class="al-seuil-head" role="button" tabindex="0"
                    (click)="toggleSeuil()" (keydown.enter)="toggleSeuil()"
                    [attr.aria-expanded]="seuilOpen()">
                    <i class="pi pi-sliders-h si" aria-hidden="true"></i>
                    <span class="al-seuil-head-title">{{ t('finances.alertes.seuilTitre') }}</span>
                    <span class="al-seuil-head-toggle">
                        @if (seuilOpen()) { {{ t('finances.alertes.replier') }} ▲ }
                        @else { {{ t('finances.alertes.configurer') }} ▼ }
                    </span>
                </div>
                @if (seuilOpen()) {
                    <div class="al-seuil-body">
                        @if (loadingSeuil()) {
                            <p-skeleton height="40px" width="300px" borderRadius="8px" style="margin-top:14px"></p-skeleton>
                        } @else {
                            <div class="al-seuil-row">
                                <div class="al-form-group">
                                    <label class="al-label" for="seuilInput">{{ t('finances.alertes.seuilLabel') }}</label>
                                    <p-inputnumber inputId="seuilInput" [(ngModel)]="seuilJours"
                                        [min]="1" [max]="365"
                                        [suffix]="' ' + t('finances.alertes.jours')"
                                        style="width:220px">
                                    </p-inputnumber>
                                </div>
                                <p-button [label]="t('finances.alertes.seuilSauvegarder')" icon="pi pi-save"
                                    [loading]="savingSeuil()" (onClick)="saveSeuil()">
                                </p-button>
                            </div>
                            @if (seuilSuccess()) {
                                <div style="margin-top:10px"><p-message severity="success" [text]="t('finances.alertes.seuilSauvegarde')"></p-message></div>
                            }
                        }
                    </div>
                }
            </div>
        }

        <!-- Toolbar : compteur + tri + actualiser -->
        <div class="al-toolbar">
            <div class="al-toolbar-left">
                @if (loading()) {
                    <p-skeleton width="140px" height="28px" borderRadius="6px"></p-skeleton>
                } @else {
                    <span class="al-count">{{ listeSortee().length }}</span>
                    <span class="al-count-label">&nbsp;{{ t('finances.alertes.elevesEnRetard') }}</span>
                }
            </div>
            <div style="display:flex;align-items:center;gap:14px">
                @if (!loading() && listeSortee().length > 0) {
                    <div class="al-sort-row">
                        <span>{{ t('finances.alertes.trierPar') }}</span>
                        <button class="al-sort-btn" [class.active]="sortBy() === 'classe'"
                            (click)="sortBy.set('classe')"
                            [attr.aria-pressed]="sortBy() === 'classe'">
                            {{ t('finances.alertes.trierParClasse') }}
                        </button>
                        <button class="al-sort-btn" [class.active]="sortBy() === 'solde'"
                            (click)="sortBy.set('solde')"
                            [attr.aria-pressed]="sortBy() === 'solde'">
                            {{ t('finances.alertes.trierParSolde') }}
                        </button>
                    </div>
                }
                <p-button icon="pi pi-refresh" [label]="t('finances.alertes.actualiser')"
                    severity="secondary" size="small" [loading]="loading()"
                    (onClick)="charger()"
                    [attr.aria-label]="t('finances.alertes.actualiser')">
                </p-button>
            </div>
        </div>

        <!-- Liste élèves en retard -->
        <div class="al-card">
            @if (loading()) {
                <p-skeleton height="140px" borderRadius="0"></p-skeleton>
            } @else if (listeSortee().length === 0) {
                <div class="al-empty">
                    <div class="al-empty-icon"><i class="pi pi-check-circle" aria-hidden="true"></i></div>
                    <div class="al-empty-title">{{ t('finances.alertes.tousAJour') }}</div>
                    <div class="al-empty-sub">{{ t('finances.alertes.aucunRetard') }}</div>
                </div>
            } @else {
                <div class="al-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>{{ t('finances.alertes.colEleve') }}</th>
                                <th>{{ t('finances.alertes.colClasse') }}</th>
                                <th style="width:180px;text-align:right">{{ t('finances.alertes.colSoldeRestant') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (e of listeSortee(); track e.eleveId) {
                                <tr>
                                    <td>
                                        <div style="font-weight:600">{{ e.prenom }} {{ e.nom }}</div>
                                        <div class="al-mat">{{ e.matricule }}</div>
                                    </td>
                                    <td>{{ e.classeLibelle }}</td>
                                    <td style="text-align:right">
                                        <span class="al-solde">{{ formatFcfa(e.soldeRestant) }}</span>
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            }
        </div>

        <!-- Zone de danger : déclenchement (séparée visuellement) -->
        @if (!loading() && listeSortee().length > 0) {
            <div class="al-danger-zone">
                <div class="al-danger-zone-icon"><i class="pi pi-send" aria-hidden="true"></i></div>
                <div class="al-danger-zone-text">
                    <div class="al-danger-zone-title">{{ t('finances.alertes.declencherZoneTitre') }}</div>
                    <div class="al-danger-zone-sub">{{ t('finances.alertes.declencherZoneSub', { nb: listeSortee().length }) }}</div>
                </div>
                <p-button [label]="t('finances.alertes.declencher')" icon="pi pi-send"
                    severity="danger" [loading]="declenchement()"
                    (onClick)="showConfirmDialog = true"
                    [attr.aria-label]="t('finances.alertes.declencher')">
                </p-button>
            </div>
        }

        <!-- Dialog confirmation déclenchement -->
        <p-dialog [(visible)]="showConfirmDialog" [modal]="true" [draggable]="false"
            [style]="{ width: '480px' }"
            [header]="t('finances.alertes.dialogTitre')">
            <div>
                <div class="dlg-notice">
                    <i class="pi pi-info-circle"></i>
                    {{ t('finances.alertes.dialogTexte', { nb: listeSortee().length }) }}
                </div>
                <p style="font-size:13px;color:var(--color-text-muted)">
                    {{ t('finances.alertes.dialogNote') }}
                </p>
                <div class="dlg-actions">
                    <p-button [label]="t('commun.annuler')" severity="secondary" [outlined]="true"
                        (onClick)="showConfirmDialog = false"></p-button>
                    <p-button [label]="t('finances.alertes.dialogConfirmer')"
                        severity="danger" icon="pi pi-send"
                        [loading]="declenchement()"
                        (onClick)="onDeclencher()"></p-button>
                </div>
            </div>
        </p-dialog>

    </ng-container>
    `
})
export class Alertes implements OnInit {
    private financesSvc = inject(FinancesService);
    private authService = inject(AuthService);
    private transloco   = inject(TranslocoService);

    readonly liste             = signal<EleveEnRetardResponse[]>([]);
    readonly loading           = signal(true);
    readonly declenchement     = signal(false);
    readonly successMsg        = signal<string | null>(null);
    readonly errorMsg          = signal<string | null>(null);
    readonly loadingSeuil      = signal(false);
    readonly savingSeuil       = signal(false);
    readonly seuilSuccess      = signal(false);
    readonly canConfigureSeuil = signal(false);
    readonly seuilOpen         = signal(false);
    readonly sortBy            = signal<SortKey>('classe');

    readonly listeSortee = computed<EleveEnRetardResponse[]>(() => {
        const l = this.liste();
        if (this.sortBy() === 'solde') return [...l].sort((a, b) => b.soldeRestant - a.soldeRestant);
        return [...l].sort((a, b) => a.classeLibelle.localeCompare(b.classeLibelle));
    });

    showConfirmDialog = false;
    seuilJours = 30;

    private successTimer: ReturnType<typeof setTimeout> | null = null;

    ngOnInit(): void {
        this.charger();
        const role = this.authService.role();
        if (role === 'SUPER_ADMIN' || role === 'ECONOMAT') {
            this.canConfigureSeuil.set(true);
            this.loadSeuil();
        }
    }

    charger(): void {
        this.loading.set(true);
        this.financesSvc.getElevesEnRetard().subscribe({
            next: list => { this.liste.set(list); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    toggleSeuil(): void { this.seuilOpen.update(v => !v); }

    private loadSeuil(): void {
        this.loadingSeuil.set(true);
        this.financesSvc.getSeuil().subscribe({
            next: s => { this.seuilJours = s.nombreJoursAvantAlerte; this.loadingSeuil.set(false); },
            error: () => this.loadingSeuil.set(false)
        });
    }

    saveSeuil(): void {
        this.savingSeuil.set(true); this.seuilSuccess.set(false);
        this.financesSvc.setSeuil(this.seuilJours).subscribe({
            next: () => {
                this.savingSeuil.set(false); this.seuilSuccess.set(true);
                setTimeout(() => this.seuilSuccess.set(false), 3000);
            },
            error: () => this.savingSeuil.set(false)
        });
    }

    onDeclencher(): void {
        this.showConfirmDialog = false;
        this.declenchement.set(true);
        this.financesSvc.declencherAlertes().subscribe({
            next: res => {
                this.declenchement.set(false);
                this.charger();
                this.setSuccess(this.transloco.translate('app.finances.alertes.declencheSucces',
                    { nb: res.notificationsEnvoyees }));
            },
            error: () => {
                this.declenchement.set(false);
                this.errorMsg.set(this.transloco.translate('app.finances.alertes.erreurDeclenchement'));
            }
        });
    }

    private setSuccess(msg: string): void {
        this.successMsg.set(msg); this.errorMsg.set(null);
        if (this.successTimer) clearTimeout(this.successTimer);
        this.successTimer = setTimeout(() => this.successMsg.set(null), 4000);
    }

    formatFcfa(v: number): string {
        return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
    }
}
