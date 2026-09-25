import {
    ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import {
    EmploiDuTempsService, EmploiDuTempsRequest, JourSemaine
} from '@/app/core/services/emploi-du-temps.service';
import { ParametrageService } from '@/app/core/services/parametrage.service';
import { PersonnelService } from '@/app/core/services/personnel.service';
import { AuthService } from '@/app/core/services/auth.service';
import { getAnneeScolaireCourante, getAnneeScolaireOptions, AnneeScolaireOption } from '@/app/core/utils/annee-scolaire.utils';

// ─── Draft ───────────────────────────────────────────────────────────────────

interface CreneauDraft {
    classeId:    string | null;
    matiereId:   string | null;
    enseignantId: string | null;
    jourSemaine: JourSemaine | null;
    heureDebut:  string;  // "HH:mm"
    heureFin:    string;  // "HH:mm"
    anneeScolaire: string;
}

const EMPTY_DRAFT: CreneauDraft = {
    classeId: null, matiereId: null, enseignantId: null,
    jourSemaine: null, heureDebut: '', heureFin: '', anneeScolaire: getAnneeScolaireCourante()
};

// ─── Composant ───────────────────────────────────────────────────────────────

@Component({
    selector: 'app-creneau-form',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, InputTextModule, SelectModule, MessageModule
    ],
    styles: [`
        .cf-shell {
            display: flex; gap: 24px; align-items: flex-start;
            container-type: inline-size;
        }
        .cf-form { flex: 1; min-width: 0; }
        .cf-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .cf-header__back {
            display: flex; align-items: center; gap: 6px;
            font-size: 13px; font-weight: 500; color: var(--color-text-muted);
            background: none; border: 0; cursor: pointer; padding: 4px 0;
            transition: color 0.15s;
        }
        .cf-header__back:hover { color: var(--color-primary); }
        .cf-header__title {
            margin: 0; font-family: var(--font-serif); font-size: 20px;
            font-weight: 700; color: var(--color-text);
        }
        .cf-card {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-radius: var(--radius-md); padding: 20px 22px 22px;
            margin-bottom: 16px; box-shadow: var(--shadow-card);
        }
        .cf-card__title {
            font-family: var(--font-serif); font-size: 15px; font-weight: 700;
            color: var(--color-text); margin: 0 0 16px;
        }
        .cf-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 12px; }
        .cf-row:last-child { margin-bottom: 0; }
        .cf-field { display: flex; flex-direction: column; gap: 5px; flex: 1 1 200px; }
        .cf-label { font-size: 12px; font-weight: 600; color: var(--color-text); }
        .cf-label--req::after { content: ' *'; color: var(--color-accent); }
        .cf-time-error {
            font-size: 11px; color: var(--color-danger);
            display: flex; align-items: center; gap: 5px;
            margin-top: 4px;
        }
        .cf-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        /* Chevauchement R4 */
        .cf-r4 {
            background: var(--color-warning-soft, #fff8e1);
            border: 1px solid var(--color-warning, #ffc107);
            border-left: 4px solid var(--color-warning, #ffc107);
            border-radius: var(--radius-md);
            padding: 12px 16px; margin-top: 12px;
        }
        .cf-r4__title {
            font-weight: 700; font-size: 13px; color: var(--color-text);
            margin-bottom: 4px;
        }
        .cf-r4__msg { font-size: 12px; color: var(--color-text-body); }
        @container (max-width: 700px) {
            .cf-shell { flex-direction: column; }
        }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="cf-shell">
            <div class="cf-form">

                <!-- En-tête -->
                <div class="cf-header">
                    <button type="button" class="cf-header__back"
                        (click)="goBack()">
                        <i class="pi pi-arrow-left"></i>
                        {{ t('emploiDuTemps.titre') }}
                    </button>
                    <h1 class="cf-header__title">{{ t('emploiDuTemps.form.titreNouveauCreneau') }}</h1>
                </div>

                <!-- Année scolaire (filtre global — en premier) -->
                <div class="cf-card">
                    <h2 class="cf-card__title">{{ t('emploiDuTemps.form.anneeScolaire') }}</h2>
                    <div class="cf-row">
                        <div class="cf-field">
                            <label class="cf-label cf-label--req">{{ t('emploiDuTemps.form.anneeScolaire') }}</label>
                            <p-select
                                [ngModel]="draft().anneeScolaire"
                                (ngModelChange)="patch('anneeScolaire', $event)"
                                [options]="anneeScolaireOptions"
                                optionLabel="label" optionValue="value"
                                [placeholder]="t('emploiDuTemps.form.selectionner')">
                            </p-select>
                        </div>
                    </div>
                </div>

                <!-- Ressources -->
                <div class="cf-card">
                    <h2 class="cf-card__title">{{ t('emploiDuTemps.form.sectionRessources') }}</h2>
                    <div class="cf-row">
                        <div class="cf-field">
                            <label class="cf-label cf-label--req">{{ t('emploiDuTemps.form.classe') }}</label>
                            <p-select
                                [ngModel]="draft().classeId"
                                (ngModelChange)="patch('classeId', $event)"
                                [options]="classeOptions()"
                                optionLabel="label" optionValue="value"
                                [filter]="true"
                                [placeholder]="t('emploiDuTemps.form.selectionner')"
                                [loading]="classesLoading()">
                            </p-select>
                        </div>
                        <div class="cf-field">
                            <label class="cf-label cf-label--req">{{ t('emploiDuTemps.form.matiere') }}</label>
                            <p-select
                                [ngModel]="draft().matiereId"
                                (ngModelChange)="patch('matiereId', $event)"
                                [options]="matiereOptions()"
                                optionLabel="label" optionValue="value"
                                [filter]="true"
                                [placeholder]="t('emploiDuTemps.form.selectionner')"
                                [loading]="matieresLoading()">
                            </p-select>
                        </div>
                        <div class="cf-field">
                            <label class="cf-label cf-label--req">{{ t('emploiDuTemps.form.enseignant') }}</label>
                            <p-select
                                [ngModel]="draft().enseignantId"
                                (ngModelChange)="patch('enseignantId', $event)"
                                [options]="enseignantOptions()"
                                optionLabel="label" optionValue="value"
                                [filter]="true"
                                [placeholder]="t('emploiDuTemps.form.selectionner')"
                                [loading]="enseignantsLoading()">
                            </p-select>
                        </div>
                    </div>
                </div>

                <!-- Horaire -->
                <div class="cf-card">
                    <h2 class="cf-card__title">{{ t('emploiDuTemps.form.sectionHoraire') }}</h2>
                    <div class="cf-row">
                        <div class="cf-field">
                            <label class="cf-label cf-label--req">{{ t('emploiDuTemps.form.jourSemaine') }}</label>
                            <p-select
                                [ngModel]="draft().jourSemaine"
                                (ngModelChange)="patch('jourSemaine', $event)"
                                [options]="jourOptions(t)"
                                optionLabel="label" optionValue="value"
                                [placeholder]="t('emploiDuTemps.form.selectionner')">
                            </p-select>
                        </div>
                        <div class="cf-field">
                            <label class="cf-label cf-label--req">{{ t('emploiDuTemps.form.heureDebut') }}</label>
                            <input pInputText type="time"
                                [ngModel]="draft().heureDebut"
                                (ngModelChange)="patch('heureDebut', $event)"
                                step="1800" />
                        </div>
                        <div class="cf-field">
                            <label class="cf-label cf-label--req">{{ t('emploiDuTemps.form.heureFin') }}</label>
                            <input pInputText type="time"
                                [ngModel]="draft().heureFin"
                                (ngModelChange)="patch('heureFin', $event)"
                                step="1800" />
                        </div>
                    </div>
                    @if (timeError()) {
                        <div class="cf-time-error">
                            <i class="pi pi-exclamation-circle"></i>
                            {{ t('emploiDuTemps.form.heureFinInvalide') }}
                        </div>
                    }
                </div>

                <!-- Erreur chevauchement (R4) -->
                @if (conflictError()) {
                    <div class="cf-r4">
                        <p class="cf-r4__title">
                            <i class="pi pi-exclamation-triangle" style="margin-right:6px"></i>
                            {{ t('emploiDuTemps.form.chevauchementTitre') }}
                        </p>
                        <p class="cf-r4__msg">{{ conflictError() }}</p>
                    </div>
                }

                @if (genericError()) {
                    <p-message severity="error" [text]="t('emploiDuTemps.form.erreurGenerique')" class="mt-3 block"></p-message>
                }

                <!-- Actions -->
                <div class="cf-actions" style="margin-top:20px">
                    <button pButton
                        [label]="t('emploiDuTemps.form.annuler')"
                        class="p-button-outlined p-button-secondary"
                        (click)="goBack()">
                    </button>
                    <button pButton
                        [label]="t('emploiDuTemps.form.enregistrer')"
                        class="p-button-success"
                        [loading]="saving()"
                        [disabled]="!canSubmit()"
                        (click)="onSubmit()">
                    </button>
                </div>
            </div>
        </div>
    </ng-container>
    `
})
export class CreneauForm implements OnInit {
    protected router         = inject(Router);
    private   route          = inject(ActivatedRoute);
    private   edtService     = inject(EmploiDuTempsService);
    private   paramService   = inject(ParametrageService);
    private   personnelSvc   = inject(PersonnelService);
    private   authService    = inject(AuthService);

    readonly saving           = signal(false);
    readonly conflictError    = signal<string | null>(null);
    readonly genericError     = signal(false);

    readonly classesLoading   = signal(false);
    readonly matieresLoading  = signal(false);
    readonly enseignantsLoading = signal(false);
    readonly classeOptions    = signal<{ label: string; value: string }[]>([]);
    readonly matiereOptions   = signal<{ label: string; value: string }[]>([]);
    readonly enseignantOptions = signal<{ label: string; value: string }[]>([]);

    private readonly _draft = signal<CreneauDraft>({ ...EMPTY_DRAFT });
    readonly draft = this._draft.asReadonly();
    readonly anneeScolaireOptions: AnneeScolaireOption[] = getAnneeScolaireOptions();

    private initClasseId:     string | null = null;
    private initEnseignantId: string | null = null;

    readonly timeError = computed(() => {
        const d = this._draft();
        return !!d.heureDebut && !!d.heureFin && d.heureFin <= d.heureDebut;
    });

    readonly canSubmit = computed(() => {
        const d = this._draft();
        return !this.saving()
            && !!d.classeId
            && !!d.matiereId
            && !!d.enseignantId
            && !!d.jourSemaine
            && !!d.heureDebut
            && !!d.heureFin
            && !this.timeError()
            && !!d.anneeScolaire.trim();
    });

    jourOptions(t: (k: string) => string) {
        return ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'].map(j => ({
            label: t('emploiDuTemps.jours.' + j),
            value: j
        }));
    }

    patch<K extends keyof CreneauDraft>(key: K, value: CreneauDraft[K]): void {
        this._draft.update(d => ({ ...d, [key]: value }));
        this.conflictError.set(null);
        this.genericError.set(false);
    }

    ngOnInit(): void {
        this.initClasseId     = this.route.snapshot.queryParamMap.get('classeId');
        this.initEnseignantId = this.route.snapshot.queryParamMap.get('enseignantId');
        this.loadClasses();
        this.loadMatieres();
        this.loadEnseignants();
    }

    private loadClasses(): void {
        this.classesLoading.set(true);
        this.paramService.getClasses(0, 200).subscribe({
            next: res => {
                this.classeOptions.set(
                    res.content.map(c => ({
                        label: `${c.libelle}${c.anneeScolaire ? ' (' + c.anneeScolaire + ')' : ''}`,
                        value: c.id
                    }))
                );
                this.classesLoading.set(false);
                if (this.initClasseId) {
                    this._draft.update(d => ({ ...d, classeId: this.initClasseId }));
                }
            },
            error: () => this.classesLoading.set(false)
        });
    }

    private loadMatieres(): void {
        this.matieresLoading.set(true);
        this.paramService.getMatieres(0, 200).subscribe({
            next: res => {
                this.matiereOptions.set(res.content.map(m => ({ label: m.libelle, value: m.id })));
                this.matieresLoading.set(false);
            },
            error: () => this.matieresLoading.set(false)
        });
    }

    private loadEnseignants(): void {
        this.enseignantsLoading.set(true);
        this.personnelSvc.rechercher({ typePersonnel: 'ENSEIGNANT' }, 0, 200, 'nom,asc').subscribe({
            next: res => {
                this.enseignantOptions.set(
                    res.content.map(p => ({ label: `${p.prenom} ${p.nom}`, value: p.id }))
                );
                this.enseignantsLoading.set(false);
                if (this.initEnseignantId) {
                    this._draft.update(d => ({ ...d, enseignantId: this.initEnseignantId }));
                }
            },
            error: () => this.enseignantsLoading.set(false)
        });
    }

    onSubmit(): void {
        if (!this.canSubmit()) return;
        this.saving.set(true);
        this.conflictError.set(null);
        this.genericError.set(false);

        const d = this._draft();
        const req: EmploiDuTempsRequest = {
            classeId:     d.classeId!,
            matiereId:    d.matiereId!,
            enseignantId: d.enseignantId!,
            jourSemaine:  d.jourSemaine!,
            heureDebut:   d.heureDebut.length === 5 ? d.heureDebut + ':00' : d.heureDebut,
            heureFin:     d.heureFin.length === 5   ? d.heureFin   + ':00' : d.heureFin,
            anneeScolaire: d.anneeScolaire.trim()
        };

        this.edtService.creerCreneau(req).subscribe({
            next: () => {
                this.saving.set(false);
                this.navigateBack({ success: 'creneauCree' });
            },
            error: (err) => {
                this.saving.set(false);
                if (err?.status === 409) {
                    const msg = err?.error?.message;
                    this.conflictError.set(typeof msg === 'string' ? msg : 'Chevauchement d\'horaire détecté.');
                } else {
                    this.genericError.set(true);
                }
            }
        });
    }

    goBack(): void {
        this.navigateBack();
    }

    private navigateBack(state?: object): void {
        const enseignantId = this.initEnseignantId;
        if (enseignantId) {
            this.router.navigate(['/app/emploi-du-temps/enseignant'], {
                queryParams: { enseignantId },
                ...(state ? { state } : {})
            });
            return;
        }
        const classeId = this._draft().classeId ?? this.initClasseId;
        this.router.navigate(['/app/emploi-du-temps/classe'], {
            ...(classeId ? { queryParams: { classeId } } : {}),
            ...(state ? { state } : {})
        });
    }
}
