import {
    ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import {
    FinancesService, VersementResponse
} from '@/app/core/services/finances.service';

@Component({
    selector: 'app-validations-bancaires',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        SlicePipe, FormsModule, TranslocoDirective,
        ButtonModule, DialogModule, MessageModule, SkeletonModule, TextareaModule
    ],
    styles: [`
        :host {
            display: block; padding: 28px; max-width: 1040px;
            --c-ok-fg: #166534; --c-ok-bg: #f0fdf4; --c-ok-bd: #bbf7d0;
            --c-warn-fg: #92400e; --c-warn-bg: #fffbeb; --c-warn-bd: #f59e0b;
            --c-ambre: #b45309;
        }
        /* ── Header ── */
        .vb-header { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; }
        .vb-header-icon {
            width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
            background: var(--c-warn-bg); border: 1px solid var(--c-warn-bd);
            display: flex; align-items: center; justify-content: center;
        }
        .vb-header-icon i { font-size: 24px; color: var(--c-ambre); }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 3px; color: var(--color-text);
             display: flex; align-items: center; gap: 10px; }
        .vb-count-badge {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 26px; height: 26px; border-radius: 13px; padding: 0 8px;
            background: var(--color-danger); color: #fff; font-size: 13px; font-weight: 700;
        }
        .vb-sub { font-size: 14px; color: var(--color-text-muted); margin: 0; }
        /* ── Bannière R18 collapsible ── */
        .vb-banner {
            background: var(--c-warn-bg); border: 1px solid var(--c-warn-bd);
            border-left: 4px solid var(--c-ambre); border-radius: 10px;
            margin-bottom: 20px; overflow: hidden;
        }
        .vb-banner-head {
            padding: 14px 18px; display: flex; align-items: center; gap: 10px;
            cursor: pointer; user-select: none;
        }
        .vb-banner-head i.bi { color: var(--c-ambre); font-size: 18px; }
        .vb-banner-title { font-size: 14px; font-weight: 700; color: var(--c-warn-fg); flex: 1; }
        .vb-banner-toggle { font-size: 11px; font-weight: 600; color: var(--c-ambre); }
        .vb-banner-body { padding: 0 18px 16px; }
        .vb-banner-body ul {
            margin: 6px 0 0; padding-left: 22px;
            font-size: 13px; color: var(--c-warn-fg); line-height: 1.7;
        }
        /* ── Feedback ── */
        .vb-feedback { margin-bottom: 16px; }
        /* ── Toolbar ── */
        .vb-toolbar {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 16px;
        }
        .vb-toolbar-left { font-size: 13px; color: var(--color-text-muted); }
        /* ── Cartes versements ── */
        .vb-card {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.05);
            margin-bottom: 14px; overflow: hidden;
        }
        .vb-card-head {
            padding: 16px 20px; display: flex; align-items: flex-start;
            justify-content: space-between; gap: 16px;
        }
        .vb-eleve-name { font-size: 16px; font-weight: 800; color: var(--color-text); }
        .vb-eleve-meta { font-size: 12px; color: var(--color-text-muted); margin-top: 3px; }
        .vb-montant { font-size: 22px; font-weight: 900; color: var(--color-text); white-space: nowrap; }
        .vb-date { font-size: 12px; color: var(--color-text-muted); text-align: right; margin-top: 4px; }
        /* ── Zone bancaire critique ── */
        .vb-bank-zone {
            background: var(--c-warn-bg); border-top: 1px solid var(--c-warn-bd); padding: 14px 20px;
        }
        .vb-bank-label {
            font-size: 9px; font-weight: 800; text-transform: uppercase;
            letter-spacing: .8px; color: var(--c-ambre); margin-bottom: 10px;
            display: flex; align-items: center; gap: 5px;
        }
        .vb-bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .vb-bank-item label {
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            letter-spacing: .5px; color: var(--c-ambre); display: block; margin-bottom: 4px;
        }
        .vb-bank-value {
            font-family: monospace; font-size: 14px; font-weight: 700; color: var(--c-warn-fg);
            word-break: break-all; background: #fef3c7; border: 1px solid var(--c-warn-bd);
            border-radius: 6px; padding: 7px 10px;
        }
        /* ── Déclarant ── */
        .vb-declarant {
            padding: 10px 20px; border-top: 1px solid var(--color-border);
            font-size: 12px; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px;
        }
        .vb-declarant-id {
            font-family: monospace; font-size: 11px; background: var(--color-surface-alt);
            border: 1px solid var(--color-border); border-radius: 4px; padding: 2px 6px; cursor: default;
        }
        /* ── Actions ── */
        .vb-card-actions {
            padding: 14px 20px; border-top: 1px solid var(--color-border);
            display: flex; align-items: center; gap: 8px;
        }
        .vb-reject-wrap { margin-left: auto; }
        /* ── Empty ── */
        .vb-empty {
            padding: 60px 20px; text-align: center;
            display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .vb-empty-icon {
            width: 64px; height: 64px; border-radius: 20px;
            background: var(--c-ok-bg); border: 1px solid var(--c-ok-bd);
            display: flex; align-items: center; justify-content: center;
        }
        .vb-empty-icon i { font-size: 28px; color: var(--c-ok-fg); }
        .vb-empty-title { font-size: 15px; font-weight: 700; color: var(--c-ok-fg); }
        .vb-empty-sub { font-size: 13px; color: var(--color-text-muted); }
        /* ── Dialog ── */
        .dlg-section { margin-bottom: 16px; }
        .dlg-section-title {
            font-size: 10px; font-weight: 800; text-transform: uppercase;
            letter-spacing: .7px; color: var(--color-text-muted); margin-bottom: 8px;
        }
        .dlg-eleve-card {
            background: var(--color-surface-alt); border: 1px solid var(--color-border);
            border-radius: 8px; padding: 12px 14px;
        }
        .dlg-bank-highlight {
            background: #fef3c7; border: 2px solid var(--c-warn-bd);
            border-radius: 10px; padding: 16px; margin-bottom: 14px;
        }
        .dlg-bank-item { margin-bottom: 10px; }
        .dlg-bank-item:last-child { margin-bottom: 0; }
        .dlg-bank-item label {
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            letter-spacing: .5px; color: var(--c-ambre); display: block; margin-bottom: 4px;
        }
        .dlg-bank-val {
            font-family: monospace; font-size: 15px; font-weight: 800;
            color: var(--c-warn-fg); word-break: break-all;
        }
        .dlg-r18-warn {
            background: #fef2f2; border: 1px solid #fecaca;
            border-radius: 8px; padding: 12px 14px;
            font-size: 13px; color: var(--color-danger); line-height: 1.6;
        }
        .dlg-r18-warn strong { display: block; margin-bottom: 4px; }
        .dlg-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
        .dlg-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .dlg-label { font-size: 13px; font-weight: 600; color: var(--color-text); }
        .dlg-req { color: var(--color-danger); }
        .dlg-error { font-size: 12px; color: var(--color-danger); }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <div class="vb-header">
            <div class="vb-header-icon"><i class="pi pi-building-columns" aria-hidden="true"></i></div>
            <div>
                <h1>
                    {{ t('finances.validations.titre') }}
                    @if (!loading() && liste().length > 0) {
                        <span class="vb-count-badge" [attr.aria-label]="liste().length + t('finances.validations.enAttenteSuffix')">
                            {{ liste().length }}
                        </span>
                    }
                </h1>
                <p class="vb-sub">{{ t('finances.validations.sousTitre') }}</p>
            </div>
        </div>

        <!-- Bannière R18 collapsible -->
        <div class="vb-banner">
            <div class="vb-banner-head" role="button" tabindex="0"
                (click)="toggleBanner()" (keydown.enter)="toggleBanner()"
                [attr.aria-expanded]="bannerOpen()">
                <i class="pi pi-exclamation-triangle bi" aria-hidden="true"></i>
                <span class="vb-banner-title">{{ t('finances.validations.bannerTitre') }}</span>
                <span class="vb-banner-toggle">
                    @if (bannerOpen()) { {{ t('finances.validations.bannerReplier') }} ▲ }
                    @else { {{ t('finances.validations.bannerDeplier') }} ▼ }
                </span>
            </div>
            @if (bannerOpen()) {
                <div class="vb-banner-body">
                    <ul>
                        <li>{{ t('finances.validations.r18Point1') }}</li>
                        <li>{{ t('finances.validations.r18Point2') }}</li>
                        <li>{{ t('finances.validations.r18Point3') }}</li>
                    </ul>
                </div>
            }
        </div>

        <!-- Feedback global -->
        @if (successMsg()) {
            <div class="vb-feedback"><p-message severity="success" [text]="successMsg()!"></p-message></div>
        }
        @if (errorMsg()) {
            <div class="vb-feedback"><p-message severity="error" [text]="errorMsg()!"></p-message></div>
        }

        <!-- Toolbar -->
        <div class="vb-toolbar">
            <span class="vb-toolbar-left">
                @if (!loading()) { {{ t('finances.validations.nEnAttente', { n: liste().length }) }} }
            </span>
            <p-button icon="pi pi-refresh" [label]="t('finances.validations.actualiser')"
                severity="secondary" size="small" [loading]="loading()"
                (onClick)="charger()"
                [attr.aria-label]="t('finances.validations.actualiser')">
            </p-button>
        </div>

        <!-- Contenu -->
        @if (loading()) {
            @for (i of [1,2,3]; track i) {
                <div class="vb-card"><p-skeleton height="160px" borderRadius="0"></p-skeleton></div>
            }
        } @else if (liste().length === 0) {
            <div class="vb-card">
                <div class="vb-empty">
                    <div class="vb-empty-icon"><i class="pi pi-check-circle" aria-hidden="true"></i></div>
                    <div class="vb-empty-title">{{ t('finances.validations.aucuneTitre') }}</div>
                    <div class="vb-empty-sub">{{ t('finances.validations.aucuneSub') }}</div>
                </div>
            </div>
        } @else {
            @for (v of liste(); track v.id) {
                <div class="vb-card">
                    <div class="vb-card-head">
                        <div>
                            <div class="vb-eleve-name">{{ v.elevePrenom }} {{ v.eleveNom }}</div>
                            <div class="vb-eleve-meta">{{ v.eleveMatricule }}</div>
                        </div>
                        <div>
                            <div class="vb-montant">{{ formatFcfa(v.montant) }}</div>
                            <div class="vb-date">{{ formatDate(v.dateVersement) }}</div>
                        </div>
                    </div>

                    <div class="vb-bank-zone">
                        <div class="vb-bank-label">
                            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                            {{ t('finances.validations.aComparer') }}
                        </div>
                        <div class="vb-bank-grid">
                            <div class="vb-bank-item">
                                <label>{{ t('finances.validations.recu') }}</label>
                                <div class="vb-bank-value">{{ v.numeroRecuBancaire || '—' }}</div>
                            </div>
                            <div class="vb-bank-item">
                                <label>{{ t('finances.validations.signataire') }}</label>
                                <div class="vb-bank-value">{{ v.nomSignataireBancaire || '—' }}</div>
                            </div>
                        </div>
                    </div>

                    @if (v.declareParId) {
                        <div class="vb-declarant">
                            <i class="pi pi-user" aria-hidden="true"></i>
                            <span>{{ t('finances.validations.declarantId') }}</span>
                            <span class="vb-declarant-id" [title]="v.declareParId">{{ v.declareParId | slice:0:8 }}…</span>
                        </div>
                    }

                    <div class="vb-card-actions">
                        <p-button icon="pi pi-check" [label]="t('finances.validations.valider')"
                            severity="success" size="small"
                            [loading]="actionId() === v.id"
                            (onClick)="openValidationDialog(v)"
                            [attr.aria-label]="t('finances.validations.valider') + ' — ' + v.elevePrenom + ' ' + v.eleveNom">
                        </p-button>
                        <span class="vb-reject-wrap">
                            <p-button icon="pi pi-times" [label]="t('finances.validations.rejeter')"
                                severity="danger" [outlined]="true" size="small"
                                [loading]="actionId() === v.id"
                                (onClick)="openRejetDialog(v)"
                                [attr.aria-label]="t('finances.validations.rejeter') + ' — ' + v.elevePrenom + ' ' + v.eleveNom">
                            </p-button>
                        </span>
                    </div>
                </div>
            }
        }

        <!-- Dialog : confirmation validation -->
        <p-dialog [(visible)]="showValidDialog" [modal]="true" [draggable]="false"
            [style]="{ width: '520px' }"
            [header]="t('finances.validations.dialogValiderTitre')">
            @if (selectedV()) {
                <div>
                    <div class="dlg-section">
                        <div class="dlg-section-title">{{ t('finances.validations.eleve') }}</div>
                        <div class="dlg-eleve-card">
                            <strong>{{ selectedV()!.elevePrenom }} {{ selectedV()!.eleveNom }}</strong>
                            — {{ formatFcfa(selectedV()!.montant) }}
                            <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px">{{ selectedV()!.eleveMatricule }}</div>
                        </div>
                    </div>
                    <div class="dlg-section">
                        <div class="dlg-section-title">{{ t('finances.validations.infoBancaireAVerif') }}</div>
                        <div class="dlg-bank-highlight">
                            <div class="dlg-bank-item">
                                <label>{{ t('finances.validations.recu') }}</label>
                                <div class="dlg-bank-val">{{ selectedV()!.numeroRecuBancaire || '—' }}</div>
                            </div>
                            <div class="dlg-bank-item">
                                <label>{{ t('finances.validations.signataire') }}</label>
                                <div class="dlg-bank-val">{{ selectedV()!.nomSignataireBancaire || '—' }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="dlg-r18-warn">
                        <strong><i class="pi pi-shield"></i> {{ t('finances.validations.r18TitreDialog') }}</strong>
                        {{ t('finances.validations.r18Avertissement') }}
                    </div>
                    <div class="dlg-actions">
                        <p-button [label]="t('commun.annuler')" severity="secondary" [outlined]="true"
                            (onClick)="showValidDialog = false"></p-button>
                        <p-button [label]="t('finances.validations.confirmerValidation')" icon="pi pi-check"
                            severity="success" [loading]="actionId() !== null"
                            (onClick)="confirmerValidation()"></p-button>
                    </div>
                </div>
            }
        </p-dialog>

        <!-- Dialog : rejet avec motif obligatoire -->
        <p-dialog [(visible)]="showRejetDialog" [modal]="true" [draggable]="false"
            [style]="{ width: '480px' }"
            [header]="t('finances.validations.dialogRejeterTitre')">
            @if (selectedV()) {
                <div>
                    <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:14px">
                        {{ selectedV()!.elevePrenom }} {{ selectedV()!.eleveNom }} · {{ formatFcfa(selectedV()!.montant) }}
                    </div>
                    <div class="dlg-form-group">
                        <label class="dlg-label" for="motifRejet">
                            {{ t('finances.validations.motifRejet') }} <span class="dlg-req">*</span>
                        </label>
                        <textarea pTextarea id="motifRejet" [(ngModel)]="motifRejet" rows="4"
                            [placeholder]="t('finances.validations.motifRejetPlaceholder')"
                            [class.p-invalid]="showMotifError() && !motifRejet.trim()"
                            style="width:100%"></textarea>
                        @if (showMotifError() && !motifRejet.trim()) {
                            <small class="dlg-error">{{ t('finances.validations.motifRejetRequis') }}</small>
                        }
                    </div>
                    <div class="dlg-actions">
                        <p-button [label]="t('commun.annuler')" severity="secondary" [outlined]="true"
                            (onClick)="showRejetDialog = false; motifRejet = ''"></p-button>
                        <p-button [label]="t('finances.validations.confirmerRejet')" icon="pi pi-times"
                            severity="danger" [loading]="actionId() !== null"
                            (onClick)="confirmerRejet()"></p-button>
                    </div>
                </div>
            }
        </p-dialog>

    </ng-container>
    `
})
export class ValidationsBancaires implements OnInit {
    private financesSvc = inject(FinancesService);
    private transloco   = inject(TranslocoService);

    readonly liste          = signal<VersementResponse[]>([]);
    readonly loading        = signal(true);
    readonly actionId       = signal<string | null>(null);
    readonly successMsg     = signal<string | null>(null);
    readonly errorMsg       = signal<string | null>(null);
    readonly bannerOpen     = signal(true);
    readonly selectedV      = signal<VersementResponse | null>(null);
    readonly showMotifError = signal(false);

    showValidDialog = false;
    showRejetDialog = false;
    motifRejet = '';

    private successTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly BANNER_KEY = 'gescol_r18_banner_open';

    ngOnInit(): void {
        const stored = localStorage.getItem(this.BANNER_KEY);
        this.bannerOpen.set(stored !== 'false');
        this.charger();
    }

    charger(): void {
        this.loading.set(true);
        this.financesSvc.getVersementsEnAttente().subscribe({
            next: list => { this.liste.set(list); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    toggleBanner(): void {
        const next = !this.bannerOpen();
        this.bannerOpen.set(next);
        localStorage.setItem(this.BANNER_KEY, String(next));
    }

    openValidationDialog(v: VersementResponse): void {
        this.selectedV.set(v); this.showValidDialog = true;
    }

    openRejetDialog(v: VersementResponse): void {
        this.selectedV.set(v); this.motifRejet = '';
        this.showMotifError.set(false); this.showRejetDialog = true;
    }

    confirmerValidation(): void {
        const v = this.selectedV();
        if (!v) return;
        this.actionId.set(v.id); this.showValidDialog = false;
        this.financesSvc.validerVersement(v.id).subscribe({
            next: () => {
                this.actionId.set(null);
                this.liste.update(l => l.filter(x => x.id !== v.id));
                this.setSuccess(this.transloco.translate('app.finances.validations.valideSucces',
                    { nom: v.elevePrenom + ' ' + v.eleveNom }));
            },
            error: err => {
                this.actionId.set(null);
                const msg = err?.error?.message;
                this.errorMsg.set(typeof msg === 'string' ? msg :
                    this.transloco.translate('app.finances.validations.erreurValidation'));
            }
        });
    }

    confirmerRejet(): void {
        this.showMotifError.set(true);
        if (!this.motifRejet.trim()) return;
        const v = this.selectedV();
        if (!v) return;
        this.actionId.set(v.id); this.showRejetDialog = false;
        this.financesSvc.rejeterVersement(v.id, { motifRejet: this.motifRejet.trim() }).subscribe({
            next: () => {
                this.actionId.set(null); this.motifRejet = '';
                this.liste.update(l => l.filter(x => x.id !== v.id));
                this.setSuccess(this.transloco.translate('app.finances.validations.rejeteSucces',
                    { nom: v.elevePrenom + ' ' + v.eleveNom }));
            },
            error: err => {
                this.actionId.set(null);
                const msg = err?.error?.message;
                this.errorMsg.set(typeof msg === 'string' ? msg :
                    this.transloco.translate('app.finances.validations.erreurRejet'));
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

    formatDate(iso: string): string {
        return iso.slice(0, 16).replace('T', ' ');
    }
}
