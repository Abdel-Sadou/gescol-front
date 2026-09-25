import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { PersonnelService, PersonnelResponse } from '@/app/core/services/personnel.service';
import { PaieService, BulletinPaieResponse, BulletinPaieRequest, ModePaiementPaie } from '@/app/core/services/paie.service';

@Component({
    selector: 'app-bulletins-paie',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, DatePipe, DecimalPipe, RouterLink, TranslocoDirective,
        ButtonModule, InputTextModule, InputNumberModule, SelectModule,
        SelectButtonModule, DatePickerModule, TableModule, MessageModule, FluidModule
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <!-- ═══════════════════════════════════════════════════════════════════
             SECTION GÉNÉRATION
        ════════════════════════════════════════════════════════════════════════ -->
        <div class="card bp-gen-card">
            <div class="bp-gen-header">
                <div>
                    <h2 class="text-xl font-semibold m-0">{{ t('paie.bulletins.sectionGeneration') }}</h2>
                    <p class="text-sm text-muted-color mt-1">{{ t('paie.bulletins.sectionGenerationSub') }}</p>
                </div>
                <span class="bp-gen-step-badge">{{ t('paie.bulletins.etape') }} {{ genStep() }}</span>
            </div>

            <!-- ── Étape 1 : Recherche de l'agent ───────────────────────── -->
            @if (!genPersonnel()) {
                <div class="bp-step-block">
                    <div class="bp-step-label">
                        <span class="bp-step-num">1</span>
                        {{ t('paie.bulletins.recherchePersonnel') }}
                    </div>
                    <div class="bp-search-row">
                        <div class="bp-search-input-wrap">
                            <i class="pi pi-search bp-search-icon"></i>
                            <input pInputText class="w-full bp-search-input"
                                [ngModel]="genQuery()" (ngModelChange)="genQuery.set($event)"
                                [placeholder]="t('paie.bulletins.recherchePlaceholder')"
                                (keyup.enter)="searchPersonnel()"
                                [disabled]="genSearching()">
                        </div>
                        <button pButton icon="pi pi-search"
                            [label]="t('paie.bulletins.rechercherBtn')"
                            [loading]="genSearching()"
                            [disabled]="!genQuery().trim()"
                            (click)="searchPersonnel()">
                        </button>
                    </div>

                    @if (genResults().length > 0) {
                        <div class="bp-results-list">
                            @for (p of genResults(); track p.id) {
                                <button class="bp-result-item" (click)="selectGenPersonnel(p)">
                                    <div class="bp-result-main">
                                        <span class="bp-result-nom">{{ p.prenom }} {{ p.nom }}</span>
                                        <span class="bp-result-mat">{{ p.matricule }}</span>
                                    </div>
                                    <span class="bp-contrat-tag" [class]="'bp-contrat-' + p.typeContrat.toLowerCase()">
                                        {{ t('paie.bulletins.typeContrats.' + p.typeContrat) }}
                                    </span>
                                    <i class="pi pi-chevron-right bp-result-arrow"></i>
                                </button>
                            }
                        </div>
                    }
                    @if (genNoResults()) {
                        <div class="bp-no-results">
                            <i class="pi pi-inbox"></i>
                            {{ t('paie.bulletins.aucunPersonnel') }}
                        </div>
                    }
                </div>
            }

            <!-- ── Étape 2 : Formulaire ─────────────────────────────────── -->
            @if (genPersonnel() && !genSuccess()) {
                <div class="bp-step-block">

                    <!-- Agent sélectionné -->
                    <div class="bp-agent-chip">
                        <div class="bp-agent-chip-info">
                            <div class="bp-agent-avatar">{{ genPersonnel()!.prenom[0] }}{{ genPersonnel()!.nom[0] }}</div>
                            <div>
                                <div class="bp-agent-name">{{ genPersonnel()!.prenom }} {{ genPersonnel()!.nom }}</div>
                                <div class="bp-agent-meta">
                                    {{ genPersonnel()!.matricule }}
                                    &nbsp;·&nbsp;
                                    <span class="bp-contrat-tag" [class]="'bp-contrat-' + genPersonnel()!.typeContrat.toLowerCase()">
                                        {{ t('paie.bulletins.typeContrats.' + genPersonnel()!.typeContrat) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button pButton class="p-button-text p-button-sm p-button-secondary"
                            icon="pi pi-times" [label]="t('paie.bulletins.changerPersonnel')"
                            (click)="clearGenPersonnel()">
                        </button>
                    </div>

                    <!-- Formulaire de génération — D6 FIX: tous les champs sont des signals -->
                    <div class="bp-form-grid">

                        <!-- Période — D12: mois + année groupés sous un seul label -->
                        <div class="flex flex-col gap-1" [class.bp-invalid]="submitted() && (!genMois() || !genAnnee())">
                            <label class="bp-label">{{ t('paie.bulletins.periode') }} <span class="bp-required">*</span></label>
                            <div class="bp-periode-row">
                                <p-select
                                    [ngModel]="genMois()" (ngModelChange)="genMois.set($event)"
                                    [options]="moisOptions()" optionLabel="label" optionValue="value"
                                    [placeholder]="t('paie.bulletins.moisLabel')"
                                    [invalid]="submitted() && !genMois()"
                                    styleClass="bp-mois-select">
                                </p-select>
                                <p-select
                                    [ngModel]="genAnnee()" (ngModelChange)="genAnnee.set($event)"
                                    [options]="anneeOptions" optionLabel="label" optionValue="value"
                                    [placeholder]="t('paie.bulletins.anneeLabel')"
                                    [invalid]="submitted() && !genAnnee()"
                                    styleClass="bp-annee-select">
                                </p-select>
                            </div>
                            @if (submitted() && (!genMois() || !genAnnee())) {
                                <small class="bp-field-error">{{ t('parametrage.commun.requis') }}</small>
                            }
                        </div>

                        <!-- Date de paiement -->
                        <div class="flex flex-col gap-1" [class.bp-invalid]="submitted() && !genDatePaiement()">
                            <label class="bp-label">{{ t('paie.bulletins.datePaiement') }} <span class="bp-required">*</span></label>
                            <p-datepicker
                                [ngModel]="genDatePaiement()" (ngModelChange)="genDatePaiement.set($event)"
                                dateFormat="dd/mm/yy"
                                [invalid]="submitted() && !genDatePaiement()"
                                styleClass="w-full">
                            </p-datepicker>
                            @if (submitted() && !genDatePaiement()) {
                                <small class="bp-field-error">{{ t('parametrage.commun.requis') }}</small>
                            }
                        </div>

                        <!-- Mode de paiement — pleine largeur -->
                        <div class="flex flex-col gap-1 bp-form-full">
                            <label class="bp-label">{{ t('paie.bulletins.modePaiement') }} <span class="bp-required">*</span></label>
                            <p-selectbutton
                                [ngModel]="genMode()" (ngModelChange)="genMode.set($event)"
                                [options]="modeOptions" optionLabel="label" optionValue="value">
                            </p-selectbutton>
                        </div>

                        <!-- Champs vacataire (conditionnels) -->
                        @if (genPersonnel()?.typeContrat === 'VACATAIRE') {
                            <div class="flex flex-col gap-1" [class.bp-invalid]="submitted() && !genHeures()">
                                <label class="bp-label">{{ t('paie.bulletins.heuresEffectuees') }} <span class="bp-required">*</span></label>
                                <p-inputnumber
                                    [ngModel]="genHeures()" (ngModelChange)="genHeures.set($event)"
                                    [min]="1" [maxFractionDigits]="1"
                                    placeholder="ex. 80"
                                    [invalid]="submitted() && !genHeures()"
                                    styleClass="w-full">
                                </p-inputnumber>
                                @if (submitted() && !genHeures()) {
                                    <small class="bp-field-error">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                            <div class="flex flex-col gap-1" [class.bp-invalid]="submitted() && !genTauxHoraire()">
                                <label class="bp-label">{{ t('paie.bulletins.tauxHoraire') }} <span class="bp-required">*</span></label>
                                <p-inputnumber
                                    [ngModel]="genTauxHoraire()" (ngModelChange)="genTauxHoraire.set($event)"
                                    [min]="1" [maxFractionDigits]="0"
                                    placeholder="ex. 3500"
                                    suffix=" FCFA/h"
                                    [invalid]="submitted() && !genTauxHoraire()"
                                    styleClass="w-full">
                                </p-inputnumber>
                                @if (submitted() && !genTauxHoraire()) {
                                    <small class="bp-field-error">{{ t('parametrage.commun.requis') }}</small>
                                }
                            </div>
                        }
                    </div>

                    <!-- Alerte R19 -->
                    @if (genError() === 'R19') {
                        <div class="bp-r19-banner">
                            <i class="pi pi-exclamation-triangle"></i>
                            <div>
                                <strong>{{ genR19Msg() ?? t('paie.bulletins.erreurR19') }}</strong>
                                <a [routerLink]="['/app/personnel', genPersonnel()!.id, 'editer']"
                                    class="bp-r19-link">
                                    {{ t('paie.bulletins.erreurR19Lien') }} <i class="pi pi-external-link"></i>
                                </a>
                            </div>
                        </div>
                    }
                    @if (genError() && genError() !== 'R19') {
                        <div class="bp-error-banner">
                            <i class="pi pi-times-circle"></i>
                            {{ t('paie.bulletins.erreurGeneration') }}
                        </div>
                    }

                    <button pButton icon="pi pi-bolt" class="bp-generer-btn"
                        [label]="t('paie.bulletins.generer')"
                        [loading]="genLoading()"
                        [disabled]="!genPersonnel()"
                        (click)="generer()">
                    </button>
                </div>
            }

            <!-- ── Étape 3 : Succès ─────────────────────────────────────── -->
            @if (genSuccess()) {
                <div class="bp-success-block">
                    <div class="bp-success-checkmark">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <h3 class="bp-success-title">{{ t('paie.bulletins.succes') }}</h3>
                    <p class="bp-success-sub">
                        {{ genPersonnel()!.prenom }} {{ genPersonnel()!.nom }}
                        &nbsp;·&nbsp;
                        {{ moisLabel(genSuccess()!.periode) }}
                    </p>

                    <!-- Montants -->
                    <div class="bp-amounts-row">
                        <div class="bp-amount-card bp-amount-brut">
                            <div class="bp-amount-label">{{ t('paie.bulletins.montantBrut') }}</div>
                            <div class="bp-amount-value">{{ genSuccess()!.montantBrut | number:'1.0-0' }}</div>
                            <div class="bp-amount-currency">FCFA</div>
                        </div>
                        <div class="bp-amount-card bp-amount-net">
                            <div class="bp-amount-label">{{ t('paie.bulletins.montantNet') }}</div>
                            <div class="bp-amount-value">{{ genSuccess()!.montantNet | number:'1.0-0' }}</div>
                            <div class="bp-amount-currency">FCFA</div>
                        </div>
                    </div>

                    <!-- PDF downloads -->
                    <div class="bp-success-actions">
                        <button pButton icon="pi pi-file-pdf" class="p-button-outlined"
                            [label]="t('paie.bulletins.telechargerBulletin')"
                            [loading]="dlBulletinId() === genSuccess()!.id"
                            (click)="downloadBulletin(genSuccess()!.id)">
                        </button>
                        @if (genSuccess()!.modePaiement === 'VIREMENT_BANCAIRE') {
                            <button pButton icon="pi pi-file-pdf" class="p-button-outlined"
                                [label]="t('paie.bulletins.telechargerOrdre')"
                                [loading]="dlOrdreId() === genSuccess()!.id"
                                (click)="downloadOrdre(genSuccess()!.id)">
                            </button>
                        }
                    </div>

                    <!-- D7 — Voir l'historique de cet agent -->
                    <button pButton icon="pi pi-history" class="p-button-info p-button-outlined bp-voir-hist-btn"
                        [label]="t('paie.bulletins.voirHistorique')"
                        (click)="voirHistoriqueAgent()">
                    </button>

                    <!-- D13 — Générer un autre bulletin (secondaire) -->
                    <button pButton class="p-button-text p-button-secondary bp-new-btn"
                        icon="pi pi-refresh"
                        [label]="t('paie.bulletins.nouveauBulletin')"
                        (click)="resetGen()">
                    </button>

                    @if (dlError()) {
                        <small class="bp-field-error" style="margin-top:4px">{{ t('paie.bulletins.erreurPdf') }}</small>
                    }
                </div>
            }
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════
             SECTION HISTORIQUE
        ════════════════════════════════════════════════════════════════════════ -->
        <div class="card mt-4">
            <div class="bh-header">
                <div>
                    <h2 class="text-xl font-semibold m-0">{{ t('paie.bulletins.sectionHistorique') }}</h2>
                    <p class="text-sm text-muted-color mt-1">{{ t('paie.bulletins.sectionHistoriqueSub') }}</p>
                </div>
            </div>

            <!-- Recherche dans l'historique -->
            @if (!histPersonnel()) {
                <div class="bp-hist-search">
                    <div class="bp-search-row">
                        <div class="bp-search-input-wrap">
                            <i class="pi pi-search bp-search-icon"></i>
                            <input pInputText class="w-full bp-search-input"
                                [ngModel]="histQuery()" (ngModelChange)="histQuery.set($event)"
                                [placeholder]="t('paie.bulletins.recherchePlaceholder')"
                                (keyup.enter)="searchHistPersonnel()"
                                [disabled]="histSearching()">
                        </div>
                        <button pButton icon="pi pi-search"
                            [label]="t('paie.bulletins.rechercherBtn')"
                            [loading]="histSearching()"
                            [disabled]="!histQuery().trim()"
                            (click)="searchHistPersonnel()">
                        </button>
                    </div>
                    @if (histResults().length > 0) {
                        <div class="bp-results-list">
                            @for (p of histResults(); track p.id) {
                                <button class="bp-result-item" (click)="selectHistPersonnel(p)">
                                    <div class="bp-result-main">
                                        <span class="bp-result-nom">{{ p.prenom }} {{ p.nom }}</span>
                                        <span class="bp-result-mat">{{ p.matricule }}</span>
                                    </div>
                                    <span class="bp-contrat-tag" [class]="'bp-contrat-' + p.typeContrat.toLowerCase()">
                                        {{ t('paie.bulletins.typeContrats.' + p.typeContrat) }}
                                    </span>
                                    <i class="pi pi-chevron-right bp-result-arrow"></i>
                                </button>
                            }
                        </div>
                    }
                    @if (histNoResults()) {
                        <div class="bp-no-results">
                            <i class="pi pi-inbox"></i>
                            {{ t('paie.bulletins.aucunPersonnel') }}
                        </div>
                    }
                </div>
            } @else {
                <!-- Agent historique sélectionné -->
                <div class="bp-agent-chip">
                    <div class="bp-agent-chip-info">
                        <div class="bp-agent-avatar">{{ histPersonnel()!.prenom[0] }}{{ histPersonnel()!.nom[0] }}</div>
                        <div>
                            <div class="bp-agent-name">{{ histPersonnel()!.prenom }} {{ histPersonnel()!.nom }}</div>
                            <div class="bp-agent-meta">{{ histPersonnel()!.matricule }}</div>
                        </div>
                    </div>
                    <button pButton class="p-button-text p-button-sm p-button-secondary"
                        icon="pi pi-times" [label]="t('paie.bulletins.changerPersonnel')"
                        (click)="clearHistPersonnel()">
                    </button>
                </div>

                @if (histLoading()) {
                    <div class="bp-loading-row">
                        <i class="pi pi-spin pi-spinner"></i>
                        {{ t('commun.chargement') }}
                    </div>
                } @else if (histError()) {
                    <div class="bp-error-banner">
                        <i class="pi pi-times-circle"></i>
                        {{ t('paie.bulletins.erreurChargement') }}
                    </div>
                } @else if (bulletins().length === 0) {
                    <div class="bp-no-results">
                        <i class="pi pi-inbox"></i>
                        {{ t('paie.bulletins.aucunBulletin') }}
                    </div>
                } @else {
                    <p-table [value]="bulletins()" styleClass="p-datatable-sm p-datatable-striped" [rowHover]="true">
                        <ng-template #header>
                            <tr>
                                <th>{{ t('paie.bulletins.colPeriode') }}</th>
                                <th class="text-right">{{ t('paie.bulletins.colBrut') }}</th>
                                <th class="text-right">{{ t('paie.bulletins.colNet') }}</th>
                                <th>{{ t('paie.bulletins.colMode') }}</th>
                                <th>{{ t('paie.bulletins.colDate') }}</th>
                                <th></th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-b>
                            <tr>
                                <td><strong>{{ moisLabel(b.periode) }}</strong></td>
                                <td class="text-right bp-font-mono">{{ b.montantBrut | number:'1.0-0' }}</td>
                                <td class="text-right bp-font-mono">{{ b.montantNet | number:'1.0-0' }}</td>
                                <td>
                                    <span class="bp-mode-badge" [class]="b.modePaiement === 'VIREMENT_BANCAIRE' ? 'bp-mode-virement' : 'bp-mode-billetage'">
                                        {{ b.modePaiement === 'VIREMENT_BANCAIRE' ? t('paie.bulletins.modeVIREMENT_BANCAIRE') : t('paie.bulletins.modeBILLETAGE') }}
                                    </span>
                                </td>
                                <!-- D10 FIX — DatePipe à la place du raw ISO -->
                                <td>{{ b.datePaiement | date:'dd/MM/yyyy' }}</td>
                                <td>
                                    <div class="bp-hist-actions">
                                        <!-- D11 FIX — [loading] par ID de bulletin -->
                                        <button pButton class="p-button-text p-button-sm" icon="pi pi-file-pdf"
                                            [label]="t('paie.bulletins.pdfBtn')"
                                            [loading]="dlBulletinId() === b.id"
                                            (click)="downloadBulletin(b.id)">
                                        </button>
                                        @if (b.modePaiement === 'VIREMENT_BANCAIRE') {
                                            <button pButton class="p-button-text p-button-sm p-button-secondary" icon="pi pi-file"
                                                [label]="t('paie.bulletins.ordreBtn')"
                                                [loading]="dlOrdreId() === b.id"
                                                (click)="downloadOrdre(b.id)">
                                            </button>
                                        }
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                }
            }
        </div>
    </ng-container>
    `,
    styles: [`
        :host { display: block; }

        /* ── En-tête génération ── */
        .bp-gen-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 24px;
        }
        .bp-gen-step-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 14px;
            border-radius: 20px;
            background: var(--primary-100, #ede9fe);
            color: var(--primary-600, #7c3aed);
            font-size: 0.8125rem;
            font-weight: 700;
        }

        /* ── Blocs étapes ── */
        .bp-step-block { display: flex; flex-direction: column; gap: 16px; }

        .bp-step-label {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            font-size: 0.9375rem;
        }
        .bp-step-num {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px; height: 26px;
            border-radius: 50%;
            background: var(--primary-500, #8b5cf6);
            color: #fff;
            font-size: 0.75rem;
            font-weight: 700;
            flex-shrink: 0;
        }

        /* ── Recherche ── */
        .bp-search-row {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .bp-search-input-wrap {
            position: relative;
            flex: 1;
        }
        .bp-search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-color-secondary);
            pointer-events: none;
            z-index: 1;
        }
        .bp-search-input { padding-left: 36px !important; }

        .bp-results-list {
            display: flex;
            flex-direction: column;
            border: 1px solid var(--surface-border, #e2e8f0);
            border-radius: 8px;
            overflow: hidden;
            max-height: 280px;
            overflow-y: auto;
        }
        .bp-result-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: none;
            border: none;
            border-bottom: 1px solid var(--surface-50, #f9fafb);
            cursor: pointer;
            text-align: left;
            transition: background 0.15s;
            width: 100%;
        }
        .bp-result-item:last-child { border-bottom: none; }
        .bp-result-item:hover { background: var(--surface-50, #fafafa); }
        .bp-result-main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .bp-result-nom { font-weight: 600; font-size: 0.9rem; color: var(--text-color); }
        .bp-result-mat { font-size: 0.8rem; color: var(--text-color-secondary); font-family: monospace; }
        .bp-result-arrow { color: var(--surface-400); font-size: 0.75rem; flex-shrink: 0; }

        .bp-no-results {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 16px;
            color: var(--text-color-secondary);
            font-size: 0.875rem;
        }

        /* ── Agent sélectionné (chip) ── */
        .bp-agent-chip {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 10px;
            background: var(--surface-50, #fafafa);
            border: 2px solid var(--primary-200, #ddd6fe);
        }
        .bp-agent-chip-info { display: flex; align-items: center; gap: 12px; }
        .bp-agent-avatar {
            width: 42px; height: 42px;
            border-radius: 50%;
            background: var(--primary-500, #8b5cf6);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.9rem;
            flex-shrink: 0;
        }
        .bp-agent-name { font-weight: 700; font-size: 0.9375rem; }
        .bp-agent-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.8rem;
            color: var(--text-color-secondary);
            margin-top: 2px;
            font-family: monospace;
        }

        /* ── Tags type contrat ── */
        .bp-contrat-tag {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .bp-contrat-vacataire      { background: var(--blue-100, #dbeafe); color: var(--blue-700, #1d4ed8); }
        .bp-contrat-semi_permanent { background: var(--yellow-100, #fef9c3); color: var(--yellow-700, #a16207); }
        .bp-contrat-permanent      { background: var(--green-100, #dcfce7); color: var(--green-700, #15803d); }

        /* ── Grille de formulaire ── */
        .bp-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .bp-form-full { grid-column: span 2; }

        /* D12 — Période : mois + année côte à côte sous un label commun */
        .bp-periode-row { display: flex; gap: 8px; }
        ::ng-deep .bp-mois-select  { flex: 2; width: 100% !important; }
        ::ng-deep .bp-annee-select { flex: 1; min-width: 90px; width: 100% !important; }

        /* Labels et validation — D8 FIX */
        .bp-label { font-weight: 600; font-size: 0.875rem; color: var(--text-color); }
        .bp-required { color: var(--red-500, #ef4444); }
        .bp-field-error { color: var(--red-600, #dc2626); font-size: 0.75rem; margin-top: 2px; }
        .bp-invalid > label { color: var(--red-600, #dc2626) !important; }

        @media (max-width: 640px) {
            .bp-form-grid { grid-template-columns: 1fr; }
            .bp-form-full { grid-column: span 1; }
            .bp-periode-row { flex-direction: column; }
        }

        /* ── Bouton générer ── */
        .bp-generer-btn {
            align-self: flex-start;
            min-width: 200px;
            height: 44px;
            font-size: 1rem;
            font-weight: 700;
            margin-top: 4px;
        }

        /* ── Alertes ── */
        .bp-r19-banner {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
            border-radius: 8px;
            background: var(--orange-50, #fff7ed);
            border: 1px solid var(--orange-300, #fdba74);
            color: var(--orange-800, #7c2d12);
        }
        .bp-r19-banner i { font-size: 1.125rem; flex-shrink: 0; margin-top: 2px; }
        .bp-r19-banner > div { display: flex; flex-direction: column; gap: 6px; }
        .bp-r19-link {
            color: var(--primary-600, #7c3aed);
            font-weight: 600;
            text-decoration: none;
            font-size: 0.875rem;
        }
        .bp-r19-link:hover { text-decoration: underline; }
        .bp-error-banner {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            border-radius: 8px;
            background: var(--red-50, #fff5f5);
            border: 1px solid var(--red-200, #feb2b2);
            color: var(--red-700, #c53030);
            font-size: 0.875rem;
        }

        /* ── Bloc succès ── */
        .bp-success-block {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            padding: 32px 24px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--green-50, #f0fdf4) 0%, #ecfdf5 100%);
            border: 2px solid var(--green-200, #bbf7d0);
            text-align: center;
        }
        .bp-success-checkmark {
            width: 64px; height: 64px;
            border-radius: 50%;
            background: var(--green-500, #22c55e);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
        }
        .bp-success-title { font-size: 1.375rem; font-weight: 700; color: var(--green-800, #166534); margin: 0; }
        .bp-success-sub { font-size: 0.875rem; color: var(--green-700, #15803d); margin: 0; font-weight: 500; }

        .bp-amounts-row { display: flex; gap: 16px; width: 100%; max-width: 380px; }
        .bp-amount-card {
            flex: 1;
            padding: 16px;
            border-radius: 10px;
            text-align: center;
        }
        .bp-amount-brut { background: var(--surface-0, #fff); border: 1px solid var(--surface-200); }
        .bp-amount-net  { background: var(--green-600, #16a34a); color: #fff; }
        .bp-amount-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.8; }
        .bp-amount-value { font-size: 1.5rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.2; margin: 4px 0; }
        .bp-amount-currency { font-size: 0.75rem; font-weight: 600; opacity: 0.75; }

        .bp-success-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }

        /* D7 — Voir historique */
        .bp-voir-hist-btn { min-width: 240px; font-weight: 600; }

        /* D13 — Générer un autre (secondaire mais visible) */
        .bp-new-btn { font-size: 0.875rem; color: var(--text-color-secondary); }

        /* ── Historique ── */
        .bh-header { margin-bottom: 20px; }
        .bp-hist-search { display: flex; flex-direction: column; gap: 12px; }

        .bp-loading-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 16px;
            color: var(--text-color-secondary);
            font-size: 0.875rem;
        }

        .bp-mode-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .bp-mode-virement  { background: var(--blue-100, #dbeafe); color: var(--blue-700, #1d4ed8); }
        .bp-mode-billetage { background: var(--surface-100, #f5f5f5); color: var(--text-color-secondary); }

        .bp-hist-actions { display: flex; gap: 4px; }
        .bp-font-mono { font-family: monospace; }
    `]
})
export class BulletinsPaie implements OnInit {
    private personnelSvc = inject(PersonnelService);
    private paieSvc      = inject(PaieService);
    private transloco    = inject(TranslocoService);

    private readonly activeLang = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });

    // ── D6 FIX : TOUS les champs formulaire sont des signals ────────────────
    readonly genQuery        = signal('');
    readonly genMois         = signal<number | null>(null);
    readonly genAnnee        = signal<number | null>(null);
    readonly genDatePaiement = signal<Date | null>(null);
    readonly genMode         = signal<ModePaiementPaie>('BILLETAGE');
    readonly genHeures       = signal<number | null>(null);
    readonly genTauxHoraire  = signal<number | null>(null);
    readonly histQuery       = signal('');

    readonly genSearching  = signal(false);
    readonly genResults    = signal<PersonnelResponse[]>([]);
    readonly genNoResults  = signal(false);
    readonly genPersonnel  = signal<PersonnelResponse | null>(null);
    readonly genLoading    = signal(false);
    readonly genError      = signal<string | null>(null);
    readonly genR19Msg     = signal<string | null>(null);
    readonly genSuccess    = signal<BulletinPaieResponse | null>(null);
    readonly submitted     = signal(false);   // D8 FIX

    readonly histSearching = signal(false);
    readonly histResults   = signal<PersonnelResponse[]>([]);
    readonly histNoResults = signal(false);
    readonly histPersonnel = signal<PersonnelResponse | null>(null);
    readonly histLoading   = signal(false);
    readonly histError     = signal(false);
    readonly bulletins     = signal<BulletinPaieResponse[]>([]);

    // D11 FIX — loading par ID de bulletin (pas global)
    readonly dlBulletinId = signal<string | null>(null);
    readonly dlOrdreId    = signal<string | null>(null);
    readonly dlError      = signal(false);

    // D9 FIX — noms de mois via Intl, réactifs à la langue
    readonly moisOptions = computed(() => {
        const lang   = this.activeLang();
        const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
        return Array.from({ length: 12 }, (_, i) => ({
            label: new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, i, 1)),
            value: i + 1
        }));
    });

    readonly anneeOptions = (() => {
        const year = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => ({ label: String(year - 2 + i), value: year - 2 + i }));
    })();

    readonly modeOptions = [
        { label: 'Billetage',        value: 'BILLETAGE' as ModePaiementPaie },
        { label: 'Virement bancaire', value: 'VIREMENT_BANCAIRE' as ModePaiementPaie }
    ];

    readonly genStep = computed(() => {
        if (this.genSuccess())   return 3;
        if (this.genPersonnel()) return 2;
        return 1;
    });

    ngOnInit(): void {}

    // ── Recherche agent (génération) ────────────────────────────────────────
    searchPersonnel(): void {
        const q = this.genQuery().trim();
        if (!q) return;
        this.genSearching.set(true);
        this.genNoResults.set(false);
        this.genResults.set([]);
        const isMatricule = /^[A-Za-z]{2}-\d/i.test(q);
        const searchParams = isMatricule ? { matricule: q } : { nom: q };
        this.personnelSvc.rechercher(searchParams, 0, 20).subscribe({
            next: page => {
                this.genResults.set(page.content ?? []);
                this.genNoResults.set((page.content ?? []).length === 0);
                this.genSearching.set(false);
            },
            error: () => { this.genSearching.set(false); this.genNoResults.set(true); }
        });
    }

    selectGenPersonnel(p: PersonnelResponse): void {
        this.genPersonnel.set(p);
        this.genResults.set([]);
        this.genNoResults.set(false);
        this.genError.set(null);
        this.submitted.set(false);
    }

    clearGenPersonnel(): void {
        this.genPersonnel.set(null);
        this.genResults.set([]);
        this.genNoResults.set(false);
        this.genQuery.set('');
        this.genSuccess.set(null);
        this.genError.set(null);
        this.genR19Msg.set(null);
        this.submitted.set(false);
        this.resetFormFields();
    }

    // ── Génération — D8 FIX: validation champ par champ ────────────────────
    generer(): void {
        this.submitted.set(true);
        const p = this.genPersonnel();
        if (!p) return;

        const isVacataire = p.typeContrat === 'VACATAIRE';
        const heuresOk    = !isVacataire || (this.genHeures() !== null && this.genHeures()! > 0);
        const tauxOk      = !isVacataire || (this.genTauxHoraire() !== null && this.genTauxHoraire()! > 0);

        if (!this.genMois() || !this.genAnnee() || !this.genDatePaiement() || !heuresOk || !tauxOk) {
            return;
        }

        const mois   = String(this.genMois()!).padStart(2, '0');
        const annee  = String(this.genAnnee()!);
        const date   = this.genDatePaiement()!;
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        const req: BulletinPaieRequest = {
            personnelId:  p.id,
            periode:      `${annee}-${mois}`,
            datePaiement: dateStr,
            modePaiement: this.genMode(),
            ...(isVacataire ? { heuresEffectuees: this.genHeures()!, tauxHoraire: this.genTauxHoraire()! } : {})
        };

        this.genLoading.set(true);
        this.genError.set(null);
        this.paieSvc.genererBulletin(req).subscribe({
            next: bul => { this.genLoading.set(false); this.genSuccess.set(bul); },
            error: err => {
                this.genLoading.set(false);
                if (err?.status === 409) {
                    this.genR19Msg.set(err?.error?.message ?? null);
                    this.genError.set('R19');
                } else {
                    this.genError.set('ERREUR');
                }
            }
        });
    }

    resetGen(): void {
        this.genSuccess.set(null);
        this.genError.set(null);
        this.genR19Msg.set(null);
        this.submitted.set(false);
        this.resetFormFields();
    }

    private resetFormFields(): void {
        this.genMois.set(null);
        this.genAnnee.set(null);
        this.genDatePaiement.set(null);
        this.genMode.set('BILLETAGE');
        this.genHeures.set(null);
        this.genTauxHoraire.set(null);
    }

    // ── D7 FIX — Lien entre succès et historique ────────────────────────────
    voirHistoriqueAgent(): void {
        const p = this.genPersonnel();
        if (!p) return;
        this.histPersonnel.set(p);
        this.histResults.set([]);
        this.histNoResults.set(false);
        this.histQuery.set('');
        this.loadHistorique(p.id);
    }

    // ── Recherche agent (historique) ────────────────────────────────────────
    searchHistPersonnel(): void {
        const q = this.histQuery().trim();
        if (!q) return;
        this.histSearching.set(true);
        this.histNoResults.set(false);
        this.histResults.set([]);
        const isMatricule = /^[A-Za-z]{2}-\d/i.test(q);
        const searchParams = isMatricule ? { matricule: q } : { nom: q };
        this.personnelSvc.rechercher(searchParams, 0, 20).subscribe({
            next: page => {
                this.histResults.set(page.content ?? []);
                this.histNoResults.set((page.content ?? []).length === 0);
                this.histSearching.set(false);
            },
            error: () => { this.histSearching.set(false); this.histNoResults.set(true); }
        });
    }

    selectHistPersonnel(p: PersonnelResponse): void {
        this.histPersonnel.set(p);
        this.histResults.set([]);
        this.histNoResults.set(false);
        this.loadHistorique(p.id);
    }

    clearHistPersonnel(): void {
        this.histPersonnel.set(null);
        this.bulletins.set([]);
        this.histQuery.set('');
        this.histError.set(false);
    }

    loadHistorique(id: string): void {
        this.histLoading.set(true);
        this.histError.set(false);
        this.bulletins.set([]);
        this.paieSvc.getBulletinsPersonnel(id).subscribe({
            next: list => { this.bulletins.set(list); this.histLoading.set(false); },
            error: ()   => { this.histError.set(true); this.histLoading.set(false); }
        });
    }

    // ── Téléchargements PDF — D11 FIX ───────────────────────────────────────
    downloadBulletin(id: string): void {
        this.dlBulletinId.set(id);
        this.dlError.set(false);
        this.paieSvc.downloadBulletinPdf(id).subscribe({
            next: blob => { this.openBlob(blob, `bulletin-${id}.pdf`); this.dlBulletinId.set(null); },
            error: ()  => { this.dlBulletinId.set(null); this.dlError.set(true); }
        });
    }

    downloadOrdre(id: string): void {
        this.dlOrdreId.set(id);
        this.dlError.set(false);
        this.paieSvc.downloadOrdreVirementPdf(id).subscribe({
            next: blob => { this.openBlob(blob, `ordre-virement-${id}.pdf`); this.dlOrdreId.set(null); },
            error: ()  => { this.dlOrdreId.set(null); this.dlError.set(true); }
        });
    }

    private openBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ── Utilitaire — libellé "Septembre 2025" depuis "2025-09" ──────────────
    moisLabel(periode: string): string {
        const [y, m] = periode.split('-');
        const lang   = this.activeLang();
        const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
        const date   = new Date(Number(y), Number(m) - 1, 1);
        const nom    = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
        return `${nom.charAt(0).toUpperCase() + nom.slice(1)} ${y}`;
    }
}
