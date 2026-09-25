import {
    ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import {
    PersonnelService, PersonnelResponse, PersonnelRequest,
    TypePersonnel, TypeContrat
} from '@/app/core/services/personnel.service';
import { ParametrageService } from '@/app/core/services/parametrage.service';

// ─── Draft ───────────────────────────────────────────────────────────────────

interface PersonnelDraft {
    nom: string;
    prenom: string;
    typePersonnel: TypePersonnel | null;
    typeContrat: TypeContrat | null;
    fonction: string;
    telephone: string;
    email: string;
    dateEmbauche: Date | null;
    matiereIds: string[];
    salaireBase: number | null;
    indemniteTransport: number | null;
    numeroCompteBancaire: string;
    nomBanque: string;
}

const EMPTY_DRAFT: PersonnelDraft = {
    nom: '', prenom: '', typePersonnel: null, typeContrat: null,
    fonction: '', telephone: '', email: '', dateEmbauche: null,
    matiereIds: [], salaireBase: null, indemniteTransport: null,
    numeroCompteBancaire: '', nomBanque: ''
};

// ─── Composant ───────────────────────────────────────────────────────────────

@Component({
    selector: 'app-personnel-form',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, InputTextModule, InputNumberModule, SelectModule,
        MultiSelectModule, DatePickerModule, MessageModule, DialogModule, TagModule
    ],
    styles: [`
        .pf-shell {
            display: flex;
            gap: 24px;
            align-items: flex-start;
            container-type: inline-size;
        }
        .pf-form { flex: 1; min-width: 0; }
        .pf-header {
            display: flex; align-items: center; gap: 14px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .pf-header__back {
            display: flex; align-items: center; gap: 6px;
            font-size: 13px; font-weight: 500; color: var(--color-text-muted);
            background: none; border: 0; cursor: pointer; padding: 4px 0;
            transition: color 0.15s;
        }
        .pf-header__back:hover { color: var(--color-primary); }
        .pf-header__title {
            margin: 0; font-family: var(--font-serif); font-size: 20px;
            font-weight: 700; color: var(--color-text);
        }
        .pf-section {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-radius: var(--radius-md); padding: 20px 22px 22px;
            margin-bottom: 16px; box-shadow: var(--shadow-card);
        }
        .pf-section__hd { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
        .pf-section__num { font-family: var(--font-serif); font-size: 13px; font-weight: 700; color: var(--color-accent); }
        .pf-section__title { margin: 0; font-family: var(--font-serif); font-size: 15px; font-weight: 700; color: var(--color-text); }
        .pf-section__hint { margin: -6px 0 14px; font-size: 12px; color: var(--color-text-muted); font-style: italic; }
        .pf-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 12px; }
        .pf-row:last-child { margin-bottom: 0; }
        .pf-field { display: flex; flex-direction: column; gap: 5px; flex: 1 1 200px; }
        .pf-field--wide { flex: 2 1 280px; }
        .pf-label { font-size: 12px; font-weight: 600; color: var(--color-text); letter-spacing: 0.3px; }
        .pf-label--req::after { content: ' *'; color: var(--color-accent); }
        .pf-hint { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
        /* Type-cards */
        .pf-type-cards { display: flex; gap: 10px; flex-wrap: wrap; }
        .pf-type-card {
            flex: 1 1 160px; display: flex; flex-direction: column; gap: 4px;
            padding: 14px 16px; border: 2px solid var(--color-border);
            border-radius: var(--radius-md); background: var(--color-surface);
            cursor: pointer; transition: border-color 0.15s, background 0.15s;
            text-align: left;
        }
        .pf-type-card:hover { border-color: var(--color-primary-soft); }
        .pf-type-card--sel { border-color: var(--color-primary); background: var(--color-primary-soft); }
        .pf-type-card__icon { font-size: 20px; color: var(--color-primary); }
        .pf-type-card__label { font-size: 13px; font-weight: 600; color: var(--color-text); }
        .pf-type-card__sub { font-size: 11px; color: var(--color-text-muted); }
        /* Rail */
        .pf-rail {
            width: 280px; flex-shrink: 0; position: sticky; top: 24px;
            display: flex; flex-direction: column; gap: 12px;
        }
        .pf-rail__preview {
            background: var(--color-primary-dark); color: #fff;
            border-radius: var(--radius-md); padding: 18px 16px;
        }
        .pf-rail__badge { font-size: 9px; font-weight: 700; letter-spacing: 1.2px; color: var(--color-accent); margin-bottom: 10px; }
        .pf-rail__name { font-family: var(--font-serif); font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 4px; min-height: 24px; }
        .pf-rail__meta { font-size: 11px; color: rgba(255,255,255,0.65); display: flex; flex-direction: column; gap: 3px; }
        .pf-rail__checks {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-radius: var(--radius-md); padding: 14px 16px; box-shadow: var(--shadow-card);
        }
        .pf-rail__checks-title { font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 10px; }
        .pf-rail__check-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--color-text-body); margin-bottom: 6px; }
        .pf-icon-ok   { color: var(--color-primary); }
        .pf-icon-miss { color: var(--color-border-field); }
        .pf-rail__actions { display: flex; flex-direction: column; gap: 8px; }
        .pf-rail__sep { border-color: var(--color-border); margin: 0 0 8px; }
        @container (max-width: 860px) {
            .pf-shell { flex-direction: column-reverse; }
            .pf-rail { width: 100%; position: static; flex-direction: row; flex-wrap: wrap; }
            .pf-rail__preview { flex: 1 1 200px; }
            .pf-rail__checks  { flex: 1 1 200px; }
            .pf-rail__actions { flex-direction: row; flex: 1 1 100%; }
        }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        @if (loading()) {
            <div class="card" style="min-height:200px;display:flex;align-items:center;justify-content:center">
                <i class="pi pi-spinner pi-spin" style="font-size:2rem;color:var(--color-primary)"></i>
            </div>
        } @else if (loadError()) {
            <div class="card">
                <p-message severity="error" [text]="t('personnel.form.erreurChargement')"></p-message>
            </div>
        } @else {
            <div class="pf-shell">

                <!-- ── Formulaire ──────────────────────────────────────────────── -->
                <div class="pf-form">

                    <!-- En-tête -->
                    <div class="pf-header">
                        <button type="button" class="pf-header__back"
                            (click)="router.navigate(['/app/personnel'])">
                            <i class="pi pi-arrow-left"></i>
                            {{ t('personnel.titre') }}
                        </button>
                        <h1 class="pf-header__title">
                            {{ isEdit() ? t('personnel.form.titreEdition') : t('personnel.form.titreCreation') }}
                        </h1>
                        @if (isEdit() && person()) {
                            <p-tag
                                [value]="person()!.actif ? t('personnel.statut.actif') : t('personnel.statut.inactif')"
                                [severity]="person()!.actif ? 'success' : 'danger'">
                            </p-tag>
                        }
                    </div>

                    <!-- § 1 — Identité -->
                    <div class="pf-section">
                        <div class="pf-section__hd">
                            <span class="pf-section__num">§ 1</span>
                            <h2 class="pf-section__title">{{ t('personnel.form.sections.identite') }}</h2>
                        </div>
                        <p class="pf-section__hint">{{ t('personnel.form.sections.identiteHint') }}</p>
                        <div class="pf-row">
                            <div class="pf-field pf-field--wide">
                                <label class="pf-label pf-label--req">{{ t('personnel.form.nom') }}</label>
                                <input pInputText type="text"
                                    [ngModel]="draft().nom"
                                    (ngModelChange)="patch('nom', $event)"
                                    placeholder="NKOA" />
                            </div>
                            <div class="pf-field pf-field--wide">
                                <label class="pf-label pf-label--req">{{ t('personnel.form.prenom') }}</label>
                                <input pInputText type="text"
                                    [ngModel]="draft().prenom"
                                    (ngModelChange)="patch('prenom', $event)"
                                    placeholder="Jean-Baptiste" />
                            </div>
                        </div>
                        <div class="pf-row">
                            <div class="pf-field">
                                <label class="pf-label">{{ t('personnel.form.telephone') }}</label>
                                <input pInputText type="tel"
                                    [ngModel]="draft().telephone"
                                    (ngModelChange)="patch('telephone', $event)"
                                    placeholder="+237 6 99 12 34 56" />
                            </div>
                            <div class="pf-field pf-field--wide">
                                <label class="pf-label">{{ t('personnel.form.email') }}</label>
                                <input pInputText type="email"
                                    [ngModel]="draft().email"
                                    (ngModelChange)="patch('email', $event)"
                                    placeholder="jean.baptiste&#64;exemple.cm" />
                            </div>
                            <div class="pf-field">
                                <label class="pf-label">{{ t('personnel.form.dateEmbauche') }}</label>
                                <p-datepicker
                                    [ngModel]="draft().dateEmbauche"
                                    (ngModelChange)="patch('dateEmbauche', $event)"
                                    dateFormat="dd/mm/yy"
                                    [showIcon]="true"
                                    appendTo="body">
                                </p-datepicker>
                            </div>
                        </div>
                    </div>

                    <!-- § 2 — Contrat -->
                    <div class="pf-section">
                        <div class="pf-section__hd">
                            <span class="pf-section__num">§ 2</span>
                            <h2 class="pf-section__title">{{ t('personnel.form.sections.contrat') }}</h2>
                        </div>
                        <p class="pf-section__hint">{{ t('personnel.form.sections.contratHint') }}</p>

                        @if (isEdit() && person()) {
                            <div class="pf-row">
                                <div class="pf-field">
                                    <label class="pf-label">{{ t('personnel.form.matricule') }}</label>
                                    <input pInputText type="text"
                                        [value]="person()!.matricule"
                                        readonly
                                        style="background:var(--color-surface-sunken);cursor:default" />
                                </div>
                            </div>
                        }

                        <!-- Type de personnel — cards -->
                        <div class="pf-row">
                            <div class="pf-field" style="flex: 0 0 100%">
                                <label class="pf-label pf-label--req">{{ t('personnel.form.typePersonnel') }}</label>
                                <div class="pf-type-cards">
                                    <button type="button"
                                        class="pf-type-card"
                                        [class.pf-type-card--sel]="draft().typePersonnel === 'ENSEIGNANT'"
                                        (click)="patch('typePersonnel', 'ENSEIGNANT')">
                                        <i class="pi pi-user-edit pf-type-card__icon"></i>
                                        <span class="pf-type-card__label">{{ t('personnel.typePersonnel.ENSEIGNANT') }}</span>
                                        <span class="pf-type-card__sub">{{ t('personnel.form.typePersonnelEnseignantSub') }}</span>
                                    </button>
                                    <button type="button"
                                        class="pf-type-card"
                                        [class.pf-type-card--sel]="draft().typePersonnel === 'NON_ENSEIGNANT'"
                                        (click)="patchTypePersonnel('NON_ENSEIGNANT')">
                                        <i class="pi pi-briefcase pf-type-card__icon"></i>
                                        <span class="pf-type-card__label">{{ t('personnel.typePersonnel.NON_ENSEIGNANT') }}</span>
                                        <span class="pf-type-card__sub">{{ t('personnel.form.typePersonnelNonSub') }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="pf-row">
                            <div class="pf-field">
                                <label class="pf-label pf-label--req">{{ t('personnel.form.typeContrat') }}</label>
                                <p-select
                                    [ngModel]="draft().typeContrat"
                                    (ngModelChange)="patch('typeContrat', $event)"
                                    [options]="typeContratOptions(t)"
                                    optionLabel="label" optionValue="value"
                                    placeholder="—">
                                </p-select>
                            </div>
                            <div class="pf-field pf-field--wide">
                                <label class="pf-label">{{ t('personnel.form.fonction') }}</label>
                                <input pInputText type="text"
                                    [ngModel]="draft().fonction"
                                    (ngModelChange)="patch('fonction', $event)"
                                    [placeholder]="t('personnel.form.fonctionPlaceholder')" />
                            </div>
                        </div>

                        <div class="pf-row">
                            <div class="pf-field">
                                <label class="pf-label">{{ t('personnel.form.salaireBase') }}</label>
                                <p-inputnumber
                                    [ngModel]="draft().salaireBase"
                                    (ngModelChange)="patch('salaireBase', $event)"
                                    [min]="0" [useGrouping]="true" suffix=" FCFA">
                                </p-inputnumber>
                                @if (draft().typeContrat === 'VACATAIRE') {
                                    <span class="pf-hint">{{ t('personnel.form.salaireVacataireHint') }}</span>
                                }
                            </div>
                            <div class="pf-field">
                                <label class="pf-label">{{ t('personnel.form.indemniteTransport') }}</label>
                                <p-inputnumber
                                    [ngModel]="draft().indemniteTransport"
                                    (ngModelChange)="patch('indemniteTransport', $event)"
                                    [min]="0" [useGrouping]="true" suffix=" FCFA">
                                </p-inputnumber>
                            </div>
                        </div>
                    </div>

                    <!-- § 3 — Matières (ENSEIGNANT uniquement — masqué, pas désactivé) -->
                    @if (draft().typePersonnel === 'ENSEIGNANT') {
                        <div class="pf-section">
                            <div class="pf-section__hd">
                                <span class="pf-section__num">§ 3</span>
                                <h2 class="pf-section__title">{{ t('personnel.form.sections.matieres') }}</h2>
                            </div>
                            <p class="pf-section__hint">{{ t('personnel.form.sections.matieresHint') }}</p>
                            @if (matieresLoading()) {
                                <p class="pf-hint">
                                    <i class="pi pi-spinner pi-spin"></i>
                                    {{ t('personnel.form.matieresChargement') }}
                                </p>
                            } @else {
                                <p-multiselect
                                    [ngModel]="draft().matiereIds"
                                    (ngModelChange)="patch('matiereIds', $event)"
                                    [options]="matiereOptions()"
                                    optionLabel="label" optionValue="value"
                                    [filter]="true"
                                    [placeholder]="t('personnel.form.matieresPlaceholder')"
                                    styleClass="w-full"
                                    appendTo="body">
                                </p-multiselect>
                            }
                        </div>
                    }

                    <!-- § 4 / § 3 — Coordonnées bancaires -->
                    <div class="pf-section">
                        <div class="pf-section__hd">
                            <span class="pf-section__num">
                                {{ draft().typePersonnel === 'ENSEIGNANT' ? '§ 4' : '§ 3' }}
                            </span>
                            <h2 class="pf-section__title">{{ t('personnel.form.sections.banque') }}</h2>
                        </div>
                        <p class="pf-section__hint">{{ t('personnel.form.sections.banqueHint') }}</p>
                        <div class="pf-row">
                            <div class="pf-field pf-field--wide">
                                <label class="pf-label">{{ t('personnel.form.numeroCompteBancaire') }}</label>
                                <input pInputText type="text"
                                    [ngModel]="draft().numeroCompteBancaire"
                                    (ngModelChange)="patch('numeroCompteBancaire', $event)"
                                    placeholder="CM21 10005 00053 00010000097 39" />
                            </div>
                            <div class="pf-field">
                                <label class="pf-label">{{ t('personnel.form.nomBanque') }}</label>
                                <input pInputText type="text"
                                    [ngModel]="draft().nomBanque"
                                    (ngModelChange)="patch('nomBanque', $event)"
                                    placeholder="SCB Cameroun" />
                            </div>
                        </div>
                    </div>

                    @if (saveError()) {
                        <p-message severity="error" [text]="saveError()!" class="mb-3 block"></p-message>
                    }
                </div>

                <!-- ── Rail ────────────────────────────────────────────────────── -->
                <aside class="pf-rail">
                    <div class="pf-rail__preview">
                        <p class="pf-rail__badge">
                            {{ isEdit() ? t('personnel.form.rail.titreFiche') : t('personnel.form.rail.titre') }}
                        </p>
                        <p class="pf-rail__name">
                            {{ fullName() || t('personnel.form.rail.nomInconnu') }}
                        </p>
                        <div class="pf-rail__meta">
                            @if (draft().typePersonnel) {
                                <span>{{ t('personnel.typePersonnel.' + draft().typePersonnel!) }}</span>
                            }
                            @if (draft().typeContrat) {
                                <span>{{ t('personnel.typeContrat.' + draft().typeContrat!) }}</span>
                            }
                            @if (isEdit() && person()) {
                                <span style="margin-top:4px">
                                    {{ person()!.actif
                                        ? t('personnel.form.rail.statutActif')
                                        : t('personnel.form.rail.statutInactif') }}
                                </span>
                            }
                        </div>
                    </div>

                    <div class="pf-rail__checks">
                        <p class="pf-rail__checks-title">{{ t('personnel.form.rail.champsObligatoires') }}</p>
                        @for (item of checklist(); track item.label) {
                            <div class="pf-rail__check-row">
                                <i class="pi"
                                    [class.pi-check-circle]="item.ok"
                                    [class.pi-circle]="!item.ok"
                                    [class.pf-icon-ok]="item.ok"
                                    [class.pf-icon-miss]="!item.ok">
                                </i>
                                <span [style.opacity]="item.ok ? '1' : '0.5'">{{ item.label }}</span>
                            </div>
                        }
                    </div>

                    <div class="pf-rail__actions">
                        <button pButton
                            [label]="t('personnel.form.annuler')"
                            class="p-button-outlined p-button-secondary w-full"
                            (click)="router.navigate(['/app/personnel'])">
                        </button>
                        <button pButton
                            [label]="isEdit() ? t('personnel.form.modifier') : t('personnel.form.creer')"
                            class="p-button-success w-full"
                            [loading]="saving()"
                            [disabled]="!canSubmit()"
                            (click)="onSubmit()">
                        </button>
                    </div>

                    @if (isEdit() && person()) {
                        <div>
                            <hr class="pf-rail__sep" />
                            @if (person()!.actif) {
                                <button pButton
                                    icon="pi pi-pause"
                                    [label]="t('personnel.desactiver')"
                                    class="p-button-outlined p-button-warning w-full"
                                    (click)="toggleDialogVisible = true">
                                </button>
                            } @else {
                                <button pButton
                                    icon="pi pi-play"
                                    [label]="t('personnel.reactiver')"
                                    class="p-button-outlined p-button-success w-full"
                                    (click)="toggleDialogVisible = true">
                                </button>
                            }
                        </div>
                    }
                </aside>
            </div>

            <!-- Dialog désactiver / réactiver -->
            @if (isEdit() && person()) {
                <p-dialog
                    [(visible)]="toggleDialogVisible"
                    [modal]="true"
                    [closable]="!toggleLoading()"
                    [style]="{ width: '420px' }"
                    [header]="person()!.actif
                        ? t('personnel.desactiverConfirm.titre')
                        : t('personnel.reactiverConfirm.titre')"
                >
                    <p class="m-0" style="color:var(--color-text-body)">
                        @if (person()!.actif) {
                            {{ t('personnel.desactiverConfirm.message',
                                { prenom: person()!.prenom, nom: person()!.nom }) }}
                        } @else {
                            {{ t('personnel.reactiverConfirm.message',
                                { prenom: person()!.prenom, nom: person()!.nom }) }}
                        }
                    </p>
                    @if (toggleError()) {
                        <p class="text-sm mt-3" style="color:var(--color-danger)">{{ toggleError() }}</p>
                    }
                    <ng-template #footer>
                        <button pButton
                            [label]="t('personnel.desactiverConfirm.annuler')"
                            class="p-button-outlined p-button-secondary"
                            [disabled]="toggleLoading()"
                            (click)="toggleDialogVisible = false; toggleError.set(null)">
                        </button>
                        <button pButton
                            [label]="person()!.actif
                                ? t('personnel.desactiverConfirm.confirmer')
                                : t('personnel.reactiverConfirm.confirmer')"
                            [class]="person()!.actif ? 'p-button-warning' : 'p-button-success'"
                            [loading]="toggleLoading()"
                            (click)="confirmToggle()">
                        </button>
                    </ng-template>
                </p-dialog>
            }
        }
    </ng-container>
    `
})
export class PersonnelForm implements OnInit {
    protected router             = inject(Router);
    private   route              = inject(ActivatedRoute);
    private   personnelService   = inject(PersonnelService);
    private   parametrageService = inject(ParametrageService);

    readonly loading         = signal(false);
    readonly loadError       = signal(false);
    readonly saving          = signal(false);
    readonly saveError       = signal<string | null>(null);
    readonly matieresLoading = signal(false);
    readonly person          = signal<PersonnelResponse | null>(null);
    readonly matiereOptions  = signal<{ label: string; value: string }[]>([]);
    readonly toggleLoading   = signal(false);
    readonly toggleError     = signal<string | null>(null);

    toggleDialogVisible = false;

    private readonly _draft = signal<PersonnelDraft>({ ...EMPTY_DRAFT });
    readonly draft = this._draft.asReadonly();

    readonly isEdit   = computed(() => !!this.route.snapshot.paramMap.get('id'));
    readonly fullName = computed(() => {
        const d = this._draft();
        return [ d.nom.trim(), d.prenom.trim()].filter(Boolean).join(' ');
    });
    readonly checklist = computed(() => {
        const d = this._draft();
        return [
            { label: 'Nom',               ok: !!d.nom.trim() },
            { label: 'Prénom',            ok: !!d.prenom.trim() },
            { label: 'Type de personnel', ok: !!d.typePersonnel },
            { label: 'Type de contrat',   ok: !!d.typeContrat }
        ];
    });
    readonly canSubmit = computed(() => this.checklist().every(c => c.ok) && !this.saving());

    typeContratOptions(t: (k: string) => string) {
        return [
            { label: t('personnel.typeContrat.VACATAIRE'),      value: 'VACATAIRE'      },
            { label: t('personnel.typeContrat.SEMI_PERMANENT'), value: 'SEMI_PERMANENT' },
            { label: t('personnel.typeContrat.PERMANENT'),      value: 'PERMANENT'      }
        ];
    }

    patch<K extends keyof PersonnelDraft>(key: K, value: PersonnelDraft[K]): void {
        this._draft.update(d => ({ ...d, [key]: value }));
    }

    patchTypePersonnel(type: TypePersonnel): void {
        this._draft.update(d => ({ ...d, typePersonnel: type, matiereIds: [] }));
    }

    ngOnInit(): void {
        this.loadMatieres();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) this.loadPersonnel(id);
    }

    private loadMatieres(): void {
        this.matieresLoading.set(true);
        this.parametrageService.getMatieres(0, 200).subscribe({
            next: res => {
                this.matiereOptions.set(res.content.map(m => ({ label: m.libelle, value: m.id })));
                this.matieresLoading.set(false);
            },
            error: () => this.matieresLoading.set(false)
        });
    }

    private loadPersonnel(id: string): void {
        this.loading.set(true);
        this.personnelService.getById(id).subscribe({
            next: p => {
                this.person.set(p);
                this._draft.set({
                    nom:                  p.nom,
                    prenom:               p.prenom,
                    typePersonnel:        p.typePersonnel,
                    typeContrat:          p.typeContrat,
                    fonction:             p.fonction ?? '',
                    telephone:            p.telephone ?? '',
                    email:                p.email ?? '',
                    dateEmbauche:         p.dateEmbauche ? new Date(p.dateEmbauche) : null,
                    matiereIds:           p.matiereIds ?? [],
                    salaireBase:          p.salaireBase ?? null,
                    indemniteTransport:   p.indemniteTransport ?? null,
                    numeroCompteBancaire: p.numeroCompteBancaire ?? '',
                    nomBanque:            p.nomBanque ?? ''
                });
                this.loading.set(false);
            },
            error: () => { this.loadError.set(true); this.loading.set(false); }
        });
    }

    onSubmit(): void {
        if (!this.canSubmit()) return;
        this.saving.set(true);
        this.saveError.set(null);

        const d = this._draft();
        const req: PersonnelRequest = {
            nom:           d.nom.trim(),
            prenom:        d.prenom.trim(),
            typePersonnel: d.typePersonnel!,
            typeContrat:   d.typeContrat!,
            ...(d.fonction             && { fonction:             d.fonction }),
            ...(d.telephone            && { telephone:            d.telephone }),
            ...(d.email                && { email:                d.email }),
            ...(d.dateEmbauche         && { dateEmbauche:         this.toIso(d.dateEmbauche) }),
            ...(d.salaireBase != null  && { salaireBase:          d.salaireBase }),
            ...(d.indemniteTransport != null && { indemniteTransport: d.indemniteTransport }),
            ...(d.numeroCompteBancaire && { numeroCompteBancaire: d.numeroCompteBancaire }),
            ...(d.nomBanque            && { nomBanque:            d.nomBanque }),
            matiereIds: d.typePersonnel === 'ENSEIGNANT' ? d.matiereIds : []
        };

        const id  = this.route.snapshot.paramMap.get('id');
        const obs = id
            ? this.personnelService.modifier(id, req)
            : this.personnelService.creer(req);

        obs.subscribe({
            next: () => {
                this.saving.set(false);
                this.router.navigate(['/app/personnel'], {
                    state: { success: id ? 'modifie' : 'cree' }
                });
            },
            error: (err) => {
                this.saving.set(false);
                const msg = err?.error?.message;
                this.saveError.set(typeof msg === 'string' ? msg : 'Une erreur est survenue. Veuillez réessayer.');
            }
        });
    }

    confirmToggle(): void {
        const p = this.person();
        if (!p) return;
        this.toggleLoading.set(true);
        this.toggleError.set(null);

        const obs = p.actif
            ? this.personnelService.desactiver(p.id)
            : this.personnelService.reactiver(p.id);

        obs.subscribe({
            next: updated => {
                this.toggleLoading.set(false);
                this.toggleDialogVisible = false;
                this.person.set(updated);
            },
            error: (err) => {
                this.toggleLoading.set(false);
                const msg = err?.error?.message;
                this.toggleError.set(typeof msg === 'string' ? msg : 'Une erreur est survenue.');
            }
        });
    }

    private toIso(d: Date): string {
        return d.toISOString().split('T')[0];
    }
}
