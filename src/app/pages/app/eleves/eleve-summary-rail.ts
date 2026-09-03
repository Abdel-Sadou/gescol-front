import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';

export interface ChecklistRow {
    readonly label: string;
    readonly done: boolean;
}

/**
 * Rail droit de l'écran "Nouvel / Modifier élève".
 * Purement présentationnel — la page parente lui fournit tout et reçoit
 * ses intentions en sortie via les outputs.
 */
@Component({
    selector: 'app-eleve-summary-rail',
    standalone: true,
    imports: [TranslocoDirective, ButtonModule, ProgressBarModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './eleve-summary-rail.css',
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <!-- ── Fiche en construction ── -->
        <section class="preview" aria-labelledby="preview-title">
            <p class="preview__kicker" id="preview-title">
                {{ isEditMode() ? t('eleveForm.rail.ficheEleve') : t('eleveForm.rail.ficheEnConstruction') }}
            </p>
            <div class="preview__identity">
                <div class="preview__photo" aria-hidden="true"><span>PHOTO</span></div>
                <div class="preview__names">
                    <p class="preview__name">
                        {{ displayName() || (isEditMode() ? t('eleveForm.rail.nomInconnu') : t('eleveForm.rail.nouvelEleve')) }}
                    </p>
                    <p class="preview__sub">
                        {{ (isEditMode() && matricule()) ? matricule() : t('eleveForm.rail.matriculeNote') }}
                    </p>
                </div>
            </div>
            <div class="preview__tags">
                @if (sexeLabel()) {
                    <span class="tag tag--neutral">{{ sexeLabel() }}</span>
                }
                @if (sousSystemeLabel()) {
                    <span class="tag tag--sub">{{ sousSystemeCode() }} · {{ sousSystemeLabel() }}</span>
                } @else {
                    <span class="tag tag--pending">{{ t('eleveForm.rail.sousSystemePending') }}</span>
                }
                @if (classeLabel()) {
                    <span class="tag tag--neutral">{{ classeLabel() }}</span>
                } @else {
                    <span class="tag tag--pending">{{ t('eleveForm.rail.classePending') }}</span>
                }
                @if (redoublant()) {
                    <span class="tag tag--neutral">{{ t('eleveForm.redoublant.titre') }}</span>
                }
            </div>
        </section>

        <!-- ── Checklist champs obligatoires ── -->
        <section class="check" aria-labelledby="check-title">
            <header class="check__head">
                <h3 class="check__title" id="check-title">{{ t('eleveForm.rail.champsObligatoires') }}</h3>
                <p class="check__count">{{ completedCount() }} / {{ requiredCount() }}</p>
            </header>
            <p-progressbar [value]="progress()" [showValue]="false" styleClass="check__bar"
                [attr.aria-label]="completedCount() + ' / ' + requiredCount()"></p-progressbar>
            <ul class="check__list" role="list">
                @for (row of checklist(); track row.label) {
                    <li class="check__row" [class.check__row--done]="row.done">
                        <span class="check__mark" [class.check__mark--done]="row.done" aria-hidden="true">
                            @if (row.done) { <i class="pi pi-check"></i> }
                        </span>
                        <span class="check__label">{{ row.label }}</span>
                    </li>
                }
            </ul>
        </section>

        <!-- ── Avertissement contextuel ── -->
        @if (blockingLabel()) {
            <div class="warn" role="alert">
                <div class="warn__head">
                    <span class="warn__icon" aria-hidden="true">⚠</span>
                    <p class="warn__title">{{ blockingLabel() }} {{ t('eleveForm.rail.warningNonRenseigne') }}</p>
                </div>
                <p class="warn__text">{{ t('eleveForm.rail.warningText') }}</p>
            </div>
        }

        <!-- ── Actions ── -->
        <div class="actions">
            <p-button
                [label]="isEditMode() ? t('eleveForm.modifier') : t('eleveForm.creer')"
                icon="pi pi-check"
                [disabled]="!canSubmit()"
                [loading]="saving()"
                styleClass="actions__primary"
                (onClick)="create.emit()">
            </p-button>
            <div class="actions__secondary">
                @if (!isEditMode()) {
                    <p-button [label]="t('eleveForm.brouillon')"
                        severity="secondary" [outlined]="true"
                        (onClick)="saveDraft.emit()">
                    </p-button>
                }
                <p-button [label]="t('eleveForm.annuler')"
                    severity="secondary" [outlined]="true"
                    (onClick)="cancel.emit()">
                </p-button>
            </div>
        </div>

    </ng-container>
    `
})
export class EleveSummaryRailComponent {
    readonly nom              = input('');
    readonly prenom           = input('');
    readonly sexeLabel        = input<string | null>(null);
    readonly sousSystemeLabel = input<string | null>(null);
    readonly sousSystemeCode  = input<string | null>(null);
    readonly classeLabel      = input<string | null>(null);
    readonly redoublant       = input(false);
    readonly matricule        = input<string | null>(null);
    readonly isEditMode       = input(false);
    readonly checklist        = input.required<readonly ChecklistRow[]>();
    readonly completedCount   = input.required<number>();
    readonly requiredCount    = input.required<number>();
    readonly progress         = input.required<number>();
    readonly canSubmit        = input.required<boolean>();
    readonly blockingLabel    = input<string | null>(null);
    readonly saving           = input(false);

    readonly create    = output<void>();
    readonly saveDraft = output<void>();
    readonly cancel    = output<void>();

    protected displayName(): string | null {
        const parts = [this.nom(), this.prenom()].filter(s => s.trim().length > 0);
        return parts.length ? parts.join(' ') : null;
    }
}
