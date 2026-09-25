import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { SkeletonModule } from 'primeng/skeleton';
import { PaieService, BaremePaieResponse, BaremePaieRequest } from '@/app/core/services/paie.service';
import { AuthService } from '@/app/core/services/auth.service';
import { TypeContrat } from '@/app/core/services/personnel.service';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';

@Component({
    selector: 'app-baremes',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule, DecimalPipe, TranslocoDirective,
        ButtonModule, DialogModule, SelectButtonModule, InputNumberModule,
        MessageModule, FluidModule, SkeletonModule,
        DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">

            <!-- En-tête -->
            <div class="bm-header">
                <div>
                    <h2 class="text-xl font-semibold m-0">
                        <i class="pi pi-calculator mr-2" style="color:var(--color-primary)"></i>
                        {{ t('paie.baremes.titre') }}
                    </h2>
                    <p class="text-sm text-muted-color mt-1">{{ t('paie.baremes.sousTitre') }}</p>
                </div>
                <div class="bm-header-right">
                    @if (baremes().length === 3) {
                        <span class="bm-complet-badge">
                            <i class="pi pi-check-circle"></i>
                            {{ t('paie.baremes.tousConfigures') }}
                        </span>
                    }
                    @if (canCreateMore()) {
                        <button pButton icon="pi pi-plus" [label]="t('paie.baremes.nouveau')"
                            class="p-button-success" (click)="openCreate()"></button>
                    }
                </div>
            </div>

            @if (!canWrite()) {
                <div class="bm-readonly-notice">
                    <i class="pi pi-lock"></i>
                    {{ t('paie.baremes.lectureSeule') }}
                </div>
            }

            @if (loadError()) {
                <div class="bm-error-banner">
                    <i class="pi pi-exclamation-triangle"></i>
                    {{ t('paie.baremes.erreurChargement') }}
                    <button pButton class="p-button-text p-button-sm" [label]="t('paie.baremes.actualiser')"
                        (click)="loadBaremes()"></button>
                </div>
            }

            <!-- État de chargement -->
            @if (loading()) {
                <div class="bm-cards">
                    @for (_ of [1, 2]; track $index) {
                        <div class="bm-card-skeleton">
                            <div class="bm-skeleton-header">
                                <p-skeleton width="8rem" height="1.75rem" borderRadius="20px"></p-skeleton>
                                <p-skeleton width="6rem" height="2rem"></p-skeleton>
                            </div>
                            <div class="bm-skeleton-body">
                                @for (_ of [1, 2, 3, 4, 5]; track $index) {
                                    <p-skeleton height="1rem" styleClass="mb-2"></p-skeleton>
                                }
                            </div>
                        </div>
                    }
                </div>
            } @else if (baremes().length === 0) {
                <!-- État vide -->
                <div class="bm-empty-state">
                    <div class="bm-empty-icon-wrap">
                        <i class="pi pi-table bm-empty-icon"></i>
                    </div>
                    <div class="bm-empty-title">{{ t('paie.baremes.aucun') }}</div>
                    <p class="bm-empty-sub">{{ t('paie.baremes.aucunSub') }}</p>
                    @if (canWrite()) {
                        <button pButton icon="pi pi-plus" [label]="t('paie.baremes.nouveau')"
                            class="p-button-success" (click)="openCreate()"></button>
                    }
                </div>
            } @else {
                <!-- Cartes barèmes -->
                <div class="bm-cards">
                    @for (b of baremes(); track b.id) {
                        <div class="bm-card" [class]="'bm-card-' + b.typeContrat.toLowerCase()">

                            <div class="bm-card-header">
                                <span class="bm-badge" [class]="'bm-badge-' + b.typeContrat.toLowerCase()">
                                    <i class="bm-badge-dot"></i>
                                    {{ t('paie.baremes.form.typeContrats.' + b.typeContrat) }}
                                </span>
                                @if (canWrite()) {
                                    <div class="bm-card-actions">
                                        <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"
                                            [label]="t('table.modifier')" (click)="openEdit(b)"></button>
                                        <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger"
                                            [label]="t('table.supprimer')" (click)="requestDelete(b)"></button>
                                    </div>
                                }
                            </div>

                            <div class="bm-card-body">

                                <!-- Retenues salariales -->
                                <div class="bm-rates-col">
                                    <div class="bm-rates-title">{{ t('paie.baremes.form.sectionSalarial') }}</div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.tauxIRPP') }}</span>
                                        <strong>{{ b.tauxIRPP | number:'1.0-4' }} %</strong>
                                    </div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.centimesIRPP') }}</span>
                                        <strong>{{ b.tauxCentimesAdditionnelsIRPP | number:'1.0-4' }} %</strong>
                                    </div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.taxeCommune') }}</span>
                                        <strong>{{ b.montantTaxeCommunale | number:'1.0-0' }} FCFA</strong>
                                    </div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.cfSalarial') }}</span>
                                        <strong>{{ b.tauxCreditFoncierSalarial | number:'1.0-4' }} %</strong>
                                    </div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.redevance') }}</span>
                                        <strong>{{ b.montantRedevanceAudiovisuelle | number:'1.0-0' }} FCFA</strong>
                                    </div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.pensionSal') }}</span>
                                        <strong>{{ b.tauxPensionVieillesseSalarial | number:'1.0-4' }} %</strong>
                                    </div>
                                </div>

                                <!-- Charges patronales -->
                                <div class="bm-rates-col bm-rates-col-right">
                                    <div class="bm-rates-title">{{ t('paie.baremes.form.sectionPatronal') }}</div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.cfPatronal') }}</span>
                                        <strong>{{ b.tauxCreditFoncierPatronal | number:'1.0-4' }} %</strong>
                                    </div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.fne') }}</span>
                                        <strong>{{ b.tauxFNE | number:'1.0-4' }} %</strong>
                                    </div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.pensionPat') }}</span>
                                        <strong>{{ b.tauxPensionVieillessePatronal | number:'1.0-4' }} %</strong>
                                    </div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.allocFamiliales') }}</span>
                                        <strong>{{ b.tauxAllocationsFamilialesPatronal | number:'1.0-4' }} %</strong>
                                    </div>
                                    <div class="bm-rate-row">
                                        <span class="bm-rate-label">{{ t('paie.baremes.cols.accidentTravail') }}</span>
                                        <strong>{{ b.tauxAccidentTravailPatronal | number:'1.0-4' }} %</strong>
                                    </div>
                                </div>

                            </div>
                        </div>
                    }
                </div>
            }
        </div>

        <!-- ── Dialog création / édition ──────────────────────────────────── -->
        <p-dialog
            [visible]="dialogVisible()" (visibleChange)="onDialogVisibleChange($event)"
            [header]="editTarget() ? t('paie.baremes.form.titreEdition') : t('paie.baremes.form.titreCreation')"
            [modal]="true" [style]="{width:'780px'}" [closable]="!saving()"
            [contentStyle]="{'max-height':'80vh','overflow-y':'auto'}"
        >
            <p-fluid>
                <form [formGroup]="form" class="flex flex-col gap-5 mt-2">

                    <!-- Type de contrat (en haut, sans encadré) — D1, D2, D4 -->
                    <div class="flex flex-col gap-2">
                        <label class="font-semibold text-sm">
                            {{ t('paie.baremes.form.typeContrat') }}
                            <span style="color:var(--color-danger)">*</span>
                        </label>
                        <p-selectbutton
                            formControlName="typeContrat"
                            [options]="contratOptions()"
                            optionLabel="label"
                            optionValue="value"
                            optionDisabled="disabled">
                        </p-selectbutton>
                        @if (form.controls['typeContrat'].invalid && form.controls['typeContrat'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                        @if (!editTarget() && baremes().length >= 3) {
                            <small style="color:var(--orange-600,#ea580c)">{{ t('paie.baremes.tousConfigures') }}</small>
                        }
                    </div>

                    <!-- Retenues salariales -->
                    <div class="bm-form-section">
                        <div class="bm-form-section-title">
                            <i class="pi pi-user bm-form-section-icon"></i>
                            {{ t('paie.baremes.form.sectionSalarial') }}
                        </div>
                        <div class="bm-form-grid">
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.tauxIRPP') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="tauxIRPP" [min]="0" [maxFractionDigits]="4"
                                    placeholder="ex. 11" suffix=" %"></p-inputnumber>
                                @if (form.controls['tauxIRPP'].invalid && form.controls['tauxIRPP'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.tauxCentimesAdditionnelsIRPP') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="tauxCentimesAdditionnelsIRPP" [min]="0" [maxFractionDigits]="4"
                                    placeholder="ex. 10" suffix=" %"></p-inputnumber>
                                @if (form.controls['tauxCentimesAdditionnelsIRPP'].invalid && form.controls['tauxCentimesAdditionnelsIRPP'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.montantTaxeCommunale') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="montantTaxeCommunale" [min]="0" [maxFractionDigits]="0"
                                    placeholder="ex. 3000" suffix=" FCFA"></p-inputnumber>
                                @if (form.controls['montantTaxeCommunale'].invalid && form.controls['montantTaxeCommunale'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.tauxCreditFoncierSalarial') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="tauxCreditFoncierSalarial" [min]="0" [maxFractionDigits]="4"
                                    placeholder="ex. 1" suffix=" %"></p-inputnumber>
                                @if (form.controls['tauxCreditFoncierSalarial'].invalid && form.controls['tauxCreditFoncierSalarial'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.montantRedevanceAudiovisuelle') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="montantRedevanceAudiovisuelle" [min]="0" [maxFractionDigits]="0"
                                    placeholder="ex. 2500" suffix=" FCFA"></p-inputnumber>
                                @if (form.controls['montantRedevanceAudiovisuelle'].invalid && form.controls['montantRedevanceAudiovisuelle'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.tauxPensionVieillesseSalarial') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="tauxPensionVieillesseSalarial" [min]="0" [maxFractionDigits]="4"
                                    placeholder="ex. 2.8" suffix=" %"></p-inputnumber>
                                @if (form.controls['tauxPensionVieillesseSalarial'].invalid && form.controls['tauxPensionVieillesseSalarial'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                        </div>
                    </div>

                    <!-- Charges patronales -->
                    <div class="bm-form-section">
                        <div class="bm-form-section-title">
                            <i class="pi pi-building bm-form-section-icon"></i>
                            {{ t('paie.baremes.form.sectionPatronal') }}
                        </div>
                        <div class="bm-form-grid">
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.tauxCreditFoncierPatronal') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="tauxCreditFoncierPatronal" [min]="0" [maxFractionDigits]="4"
                                    placeholder="ex. 1.5" suffix=" %"></p-inputnumber>
                                @if (form.controls['tauxCreditFoncierPatronal'].invalid && form.controls['tauxCreditFoncierPatronal'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.tauxFNE') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="tauxFNE" [min]="0" [maxFractionDigits]="4"
                                    placeholder="ex. 1" suffix=" %"></p-inputnumber>
                                @if (form.controls['tauxFNE'].invalid && form.controls['tauxFNE'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.tauxPensionVieillessePatronal') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="tauxPensionVieillessePatronal" [min]="0" [maxFractionDigits]="4"
                                    placeholder="ex. 3.7" suffix=" %"></p-inputnumber>
                                @if (form.controls['tauxPensionVieillessePatronal'].invalid && form.controls['tauxPensionVieillessePatronal'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.tauxAllocationsFamilialesPatronal') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="tauxAllocationsFamilialesPatronal" [min]="0" [maxFractionDigits]="4"
                                    placeholder="ex. 7" suffix=" %"></p-inputnumber>
                                @if (form.controls['tauxAllocationsFamilialesPatronal'].invalid && form.controls['tauxAllocationsFamilialesPatronal'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('paie.baremes.form.tauxAccidentTravailPatronal') }} <span style="color:var(--color-danger)">*</span></label>
                                <p-inputnumber formControlName="tauxAccidentTravailPatronal" [min]="0" [maxFractionDigits]="4"
                                    placeholder="ex. 1.75" suffix=" %"></p-inputnumber>
                                @if (form.controls['tauxAccidentTravailPatronal'].invalid && form.controls['tauxAccidentTravailPatronal'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                        </div>
                    </div>

                    @if (saveError()) {
                        <div><p-message severity="error" [text]="saveError()!"></p-message></div>
                    }
                </form>
            </p-fluid>
            <ng-template #footer>
                <button pButton severity="secondary" [label]="t('paie.baremes.annuler')"
                    [disabled]="saving()" (click)="closeDialog()"></button>
                <button pButton
                    [label]="editTarget() ? t('paie.baremes.enregistrer') : t('paie.baremes.creer')"
                    [loading]="saving()" (click)="onSubmit()"></button>
            </ng-template>
        </p-dialog>

        <gescol-delete-confirm-dialog
            [(visible)]="deleteVisible"
            [itemLabel]="deleteLabel"
            [deleteFn]="deleteFn"
            (deleted)="onDeleted()"
        ></gescol-delete-confirm-dialog>
    </ng-container>
    `,
    styles: [`
        :host { display: block; }

        /* ── En-tête ── */
        .bm-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 24px;
        }
        .bm-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

        .bm-complet-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 14px;
            border-radius: 20px;
            background: var(--green-100, #dcfce7);
            color: var(--green-700, #15803d);
            font-size: 0.8125rem;
            font-weight: 600;
        }

        .bm-readonly-notice {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: 8px;
            background: var(--surface-100, #f5f5f5);
            color: var(--text-color-secondary);
            font-size: 0.875rem;
            margin-bottom: 20px;
        }

        .bm-error-banner {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: 8px;
            background: var(--red-50, #fff5f5);
            border: 1px solid var(--red-200, #feb2b2);
            color: var(--red-700, #c53030);
            font-size: 0.875rem;
            margin-bottom: 20px;
        }

        /* ── État vide ── */
        .bm-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 56px 24px;
            text-align: center;
        }
        .bm-empty-icon-wrap {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: var(--surface-100, #f5f5f5);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .bm-empty-icon { font-size: 2rem; color: var(--surface-400, #9ca3af); }
        .bm-empty-title { font-size: 1.125rem; font-weight: 600; color: var(--text-color); }
        .bm-empty-sub { font-size: 0.875rem; color: var(--text-color-secondary); margin: 0; max-width: 360px; }

        /* ── Skeleton ── */
        .bm-cards { display: flex; flex-direction: column; gap: 16px; }

        .bm-card-skeleton {
            border-radius: 10px;
            border: 1px solid var(--surface-border, #e2e8f0);
            overflow: hidden;
        }
        .bm-skeleton-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 18px;
            background: var(--surface-50, #fafafa);
            border-bottom: 1px solid var(--surface-border);
        }
        .bm-skeleton-body { padding: 16px 18px; }

        /* ── Carte barème ── */
        .bm-card {
            border-radius: 10px;
            border: 1px solid var(--surface-border, #e2e8f0);
            border-left-width: 4px;
            overflow: hidden;
            transition: box-shadow 0.2s ease;
        }
        .bm-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .bm-card-vacataire     { border-left-color: var(--blue-500, #3b82f6); }
        .bm-card-semi_permanent { border-left-color: var(--yellow-500, #eab308); }
        .bm-card-permanent     { border-left-color: var(--green-500, #22c55e); }

        .bm-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 18px;
            background: var(--surface-50, #fafafa);
            border-bottom: 1px solid var(--surface-border, #e2e8f0);
        }

        .bm-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 700;
        }
        .bm-badge-dot {
            width: 7px; height: 7px;
            border-radius: 50%;
            display: inline-block;
        }
        .bm-badge-vacataire      { background: var(--blue-100, #dbeafe); color: var(--blue-700, #1d4ed8); }
        .bm-badge-vacataire .bm-badge-dot { background: var(--blue-500, #3b82f6); }
        .bm-badge-semi_permanent { background: var(--yellow-100, #fef9c3); color: var(--yellow-700, #a16207); }
        .bm-badge-semi_permanent .bm-badge-dot { background: var(--yellow-500, #eab308); }
        .bm-badge-permanent      { background: var(--green-100, #dcfce7); color: var(--green-700, #15803d); }
        .bm-badge-permanent .bm-badge-dot { background: var(--green-500, #22c55e); }

        .bm-card-actions { display: flex; gap: 4px; }

        .bm-card-body {
            display: grid;
            grid-template-columns: 1fr 1fr;
        }

        .bm-rates-col { padding: 16px 18px; }
        .bm-rates-col-right { border-left: 1px solid var(--surface-border, #e2e8f0); }

        .bm-rates-title {
            font-size: 0.6875rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-color-secondary);
            margin-bottom: 10px;
        }

        .bm-rate-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 8px;
            padding: 3px 0;
            font-size: 0.8125rem;
        }
        .bm-rate-row + .bm-rate-row { border-top: 1px solid var(--surface-50, #f9fafb); }
        .bm-rate-label { color: var(--text-color-secondary); white-space: nowrap; flex-shrink: 0; }
        .bm-rate-row strong { font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }

        @media (max-width: 640px) {
            .bm-card-body { grid-template-columns: 1fr; }
            .bm-rates-col-right { border-left: none; border-top: 1px solid var(--surface-border); }
        }

        /* ── Formulaire dialog ── */
        .bm-form-section {
            border: 1px solid var(--surface-border, #e2e8f0);
            border-radius: 8px;
            padding: 16px;
        }
        .bm-form-section-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.8125rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-color-secondary);
            margin-bottom: 14px;
        }
        .bm-form-section-icon { font-size: 0.875rem; }
        .bm-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }
        @media (max-width: 560px) { .bm-form-grid { grid-template-columns: 1fr; } }
    `]
})
export class Baremes implements OnInit {
    private paie  = inject(PaieService);
    private auth  = inject(AuthService);
    private fb    = inject(FormBuilder);
    private t9n   = inject(TranslocoService);

    private readonly activeLang = toSignal(this.t9n.langChanges$, { initialValue: this.t9n.getActiveLang() });

    readonly baremes      = signal<BaremePaieResponse[]>([]);
    readonly loading      = signal(false);
    readonly loadError    = signal(false);
    readonly saving       = signal(false);
    readonly saveError    = signal<string | null>(null);
    readonly dialogVisible = signal(false);
    readonly editTarget    = signal<BaremePaieResponse | null>(null);

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    readonly canWrite     = computed(() => this.auth.role() === 'SUPER_ADMIN');
    readonly canCreateMore = computed(() => this.baremes().length < 3 && this.canWrite());

    // D1 + D2 — p-selectbutton avec options grisant les types déjà configurés
    readonly contratOptions = computed(() => {
        this.activeLang();
        const existing = this.baremes().map(b => b.typeContrat);
        const editing  = this.editTarget();
        return (['VACATAIRE', 'SEMI_PERMANENT', 'PERMANENT'] as TypeContrat[]).map(type => ({
            label:    this.t9n.translate(`app.paie.baremes.form.typeContrats.${type}`),
            value:    type,
            disabled: existing.includes(type) && editing?.typeContrat !== type
        }));
    });

    readonly form = this.fb.group({
        typeContrat:                      [null as TypeContrat | null, Validators.required],
        tauxIRPP:                         [null as number | null, [Validators.required, Validators.min(0)]],
        tauxCentimesAdditionnelsIRPP:     [null as number | null, [Validators.required, Validators.min(0)]],
        montantTaxeCommunale:             [null as number | null, [Validators.required, Validators.min(0)]],
        tauxCreditFoncierSalarial:        [null as number | null, [Validators.required, Validators.min(0)]],
        montantRedevanceAudiovisuelle:    [null as number | null, [Validators.required, Validators.min(0)]],
        tauxPensionVieillesseSalarial:    [null as number | null, [Validators.required, Validators.min(0)]],
        tauxCreditFoncierPatronal:        [null as number | null, [Validators.required, Validators.min(0)]],
        tauxFNE:                          [null as number | null, [Validators.required, Validators.min(0)]],
        tauxPensionVieillessePatronal:    [null as number | null, [Validators.required, Validators.min(0)]],
        tauxAllocationsFamilialesPatronal:[null as number | null, [Validators.required, Validators.min(0)]],
        tauxAccidentTravailPatronal:      [null as number | null, [Validators.required, Validators.min(0)]]
    });

    ngOnInit(): void { this.loadBaremes(); }

    loadBaremes(): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.paie.getBaremes(0, 20).subscribe({
            next: page => { this.baremes.set(page.content); this.loading.set(false); },
            error: ()   => { this.loadError.set(true); this.loading.set(false); }
        });
    }

    openCreate(): void {
        this.editTarget.set(null);
        this.saveError.set(null);
        this.form.reset();
        this.dialogVisible.set(true);
    }

    openEdit(b: BaremePaieResponse): void {
        this.editTarget.set(b);
        this.saveError.set(null);
        this.form.patchValue({
            typeContrat:                      b.typeContrat,
            tauxIRPP:                         b.tauxIRPP,
            tauxCentimesAdditionnelsIRPP:     b.tauxCentimesAdditionnelsIRPP,
            montantTaxeCommunale:             b.montantTaxeCommunale,
            tauxCreditFoncierSalarial:        b.tauxCreditFoncierSalarial,
            montantRedevanceAudiovisuelle:    b.montantRedevanceAudiovisuelle,
            tauxPensionVieillesseSalarial:    b.tauxPensionVieillesseSalarial,
            tauxCreditFoncierPatronal:        b.tauxCreditFoncierPatronal,
            tauxFNE:                          b.tauxFNE,
            tauxPensionVieillessePatronal:    b.tauxPensionVieillessePatronal,
            tauxAllocationsFamilialesPatronal: b.tauxAllocationsFamilialesPatronal,
            tauxAccidentTravailPatronal:      b.tauxAccidentTravailPatronal
        });
        this.dialogVisible.set(true);
    }

    onDialogVisibleChange(visible: boolean): void { if (!visible && !this.saving()) this.dialogVisible.set(false); }
    closeDialog(): void { if (!this.saving()) this.dialogVisible.set(false); }

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) return;
        const v = this.form.getRawValue();
        const req: BaremePaieRequest = {
            typeContrat:                      v.typeContrat!,
            tauxIRPP:                         v.tauxIRPP!,
            tauxCentimesAdditionnelsIRPP:     v.tauxCentimesAdditionnelsIRPP!,
            montantTaxeCommunale:             v.montantTaxeCommunale!,
            tauxCreditFoncierSalarial:        v.tauxCreditFoncierSalarial!,
            tauxCreditFoncierPatronal:        v.tauxCreditFoncierPatronal!,
            montantRedevanceAudiovisuelle:    v.montantRedevanceAudiovisuelle!,
            tauxFNE:                          v.tauxFNE!,
            tauxPensionVieillesseSalarial:    v.tauxPensionVieillesseSalarial!,
            tauxPensionVieillessePatronal:    v.tauxPensionVieillessePatronal!,
            tauxAllocationsFamilialesPatronal: v.tauxAllocationsFamilialesPatronal!,
            tauxAccidentTravailPatronal:      v.tauxAccidentTravailPatronal!
        };
        this.saving.set(true);
        this.saveError.set(null);
        const target = this.editTarget();
        const req$   = target ? this.paie.modifierBareme(target.id, req) : this.paie.creerBareme(req);
        req$.subscribe({
            next: () => { this.saving.set(false); this.dialogVisible.set(false); this.loadBaremes(); },
            error: err => {
                this.saving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.saveError.set(typeof msg === 'string' ? msg : this.t9n.translate('app.paie.baremes.erreurEnregistrement'));
            }
        });
    }

    requestDelete(b: BaremePaieResponse): void {
        this.deleteLabel  = this.t9n.translate(`app.paie.baremes.form.typeContrats.${b.typeContrat}`);
        this.deleteFn     = () => this.paie.supprimerBareme(b.id);
        this.deleteVisible = true;
    }

    onDeleted(): void { this.loadBaremes(); }
}
