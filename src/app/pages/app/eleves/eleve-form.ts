import {
    ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageModule } from 'primeng/message';
import { EleveService, EleveRequest } from '@/app/core/services/eleve.service';
import { EleveSummaryRailComponent, ChecklistRow } from './eleve-summary-rail';

// ─── Types ───────────────────────────────────────────────────────────────────

type Sex = 'M' | 'F';
type SousSysteme = 'FRANCOPHONE' | 'ANGLOPHONE';

interface EleveDraft {
    nom: string;
    prenom: string;
    sexe: Sex | null;
    dateNaissance: Date | null;
    lieuNaissance: string;
    groupeSanguin: string | null;
    sousSysteme: SousSysteme | null;
    classeId: string | null;
    redoublant: boolean;
    apteSport: boolean;
    nomPere: string;
    nomMere: string;
    quartier: string;
    personneContact: string;
    telephoneContact: string;
}

interface ClasseApiItem {
    id: string;
    libelle: string;
    sousSysteme: SousSysteme;
}

type FilledMap = Record<string, boolean>;

// ─── Constantes ──────────────────────────────────────────────────────────────

function emptyDraft(): EleveDraft {
    return {
        nom: '', prenom: '', sexe: null, dateNaissance: null, lieuNaissance: '',
        groupeSanguin: null, sousSysteme: null, classeId: null,
        redoublant: false, apteSport: false, nomPere: '', nomMere: '',
        quartier: '', personneContact: '', telephoneContact: ''
    };
}

const SOUS_SYSTEMES: readonly { value: SousSysteme; code: string }[] = [
    { value: 'FRANCOPHONE', code: 'FR' },
    { value: 'ANGLOPHONE',  code: 'EN' },
];

/** Champs requis côté API — définit l'ordre dans la checklist. */
const REQUIRED_FIELD_KEYS = [
    { key: 'nom'           as const, labelKey: 'eleveForm.nom' },
    { key: 'prenom'        as const, labelKey: 'eleveForm.prenom' },
    { key: 'sexe'          as const, labelKey: 'eleveForm.sexe.label' },
    { key: 'dateNaissance' as const, labelKey: 'eleveForm.dateNaissance' },
    { key: 'classeId'      as const, labelKey: 'eleveForm.classe' },
] as const;

const BLOOD_GROUPS = [
    { value: 'A_POS',   label: 'A+'  },
    { value: 'A_NEG',   label: 'A−'  },
    { value: 'B_POS',   label: 'B+'  },
    { value: 'B_NEG',   label: 'B−'  },
    { value: 'AB_POS',  label: 'AB+' },
    { value: 'AB_NEG',  label: 'AB−' },
    { value: 'O_POS',   label: 'O+'  },
    { value: 'O_NEG',   label: 'O−'  },
    { value: 'INCONNU', label: '?'   },
];

// ─── Composant ───────────────────────────────────────────────────────────────

@Component({
    selector: 'app-eleve-form',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, InputTextModule, SelectModule,
        DatePickerModule, CheckboxModule, SelectButtonModule, MessageModule,
        EleveSummaryRailComponent,
    ],
    styleUrl: './eleve-form.css',
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
    <div class="ef-frame">

        <!-- ═══════════════ Colonne de saisie ═══════════════ -->
        <form class="ef-form" novalidate (ngSubmit)="onSubmit()">

            <header class="ef-head">
                <p-button icon="pi pi-arrow-left" severity="secondary" [text]="true" [rounded]="true"
                    [ariaLabel]="t('eleveForm.annuler')" (onClick)="goBack()"></p-button>
                <h1 class="ef-title">
                    {{ isEditMode ? t('eleveForm.titreEdition') : t('eleveForm.titreCreation') }}
                </h1>
                @if (draftSavedAt()) {
                    <p class="ef-stamp">{{ draftSavedAt() }}</p>
                }
            </header>

            <!-- Matricule (lecture seule en édition) -->
            @if (isEditMode && matricule()) {
                <div class="ef-body" style="padding-bottom: 0;">
                    <div class="ef-matricule">
                        <span class="ef-matricule__label">{{ t('eleveForm.matriculeLabel') }}</span>
                        <span class="ef-matricule__value">{{ matricule() }}</span>
                    </div>
                </div>
            }

            @if (loadingEleve()) {
                <div class="ef-body" style="display:flex; justify-content:center; padding:48px 24px;">
                    <i class="pi pi-spin pi-spinner" style="font-size:2rem; color:var(--p-primary-color)"></i>
                </div>
            } @else if (loadError()) {
                <div class="ef-body">
                    <p-message severity="error" [text]="t('eleveForm.erreurChargement')"></p-message>
                </div>
            } @else {
            <div class="ef-body">

                <!-- ─── 1. Identité ─── -->
                <div class="ef-section">
                    <span class="ef-section__num" aria-hidden="true">1</span>
                    <h2 class="ef-section__title">{{ t('eleveForm.sections.identite') }}</h2>
                    <span class="ef-section__hint">{{ t('eleveForm.sections.identiteHint') }}</span>
                    <span class="ef-section__rule" aria-hidden="true"></span>
                </div>

                <div class="ef-row">
                    <label class="ef-field ef-field--wide" [class]="cls('nom')">
                        <span class="ef-label">{{ t('eleveForm.nom') }} <span class="ef-req">*</span></span>
                        <input pInputText
                            [ngModel]="draft().nom" (ngModelChange)="patch('nom', $event)"
                            name="nom" autocomplete="family-name" />
                    </label>

                    <label class="ef-field ef-field--wide" [class]="cls('prenom')">
                        <span class="ef-label">{{ t('eleveForm.prenom') }} <span class="ef-req">*</span></span>
                        <input pInputText
                            [ngModel]="draft().prenom" (ngModelChange)="patch('prenom', $event)"
                            name="prenom" autocomplete="given-name" />
                    </label>

                    <div class="ef-field ef-field--narrow" [class]="cls('sexe')">
                        <span class="ef-label" id="sexe-label">
                            {{ t('eleveForm.sexe.label') }} <span class="ef-req">*</span>
                        </span>
                        <p-selectbutton
                            [options]="sexOptions()" optionLabel="label" optionValue="value"
                            [allowEmpty]="false"
                            [ngModel]="draft().sexe" (ngModelChange)="patch('sexe', $event)"
                            name="sexe" ariaLabelledBy="sexe-label">
                        </p-selectbutton>
                    </div>
                </div>

                <div class="ef-row">
                    <div class="ef-field ef-field--date" [class]="cls('dateNaissance')">
                        <span class="ef-label">
                            {{ t('eleveForm.dateNaissance') }} <span class="ef-req">*</span>
                        </span>
                        <p-datepicker
                            [ngModel]="draft().dateNaissance" (ngModelChange)="patch('dateNaissance', $event)"
                            name="dateNaissance" dateFormat="dd/mm/yy"
                            [maxDate]="maxDate" [showIcon]="true" iconDisplay="input" appendTo="body">
                        </p-datepicker>
                    </div>

                    <label class="ef-field ef-field--wide">
                        <span class="ef-label">{{ t('eleveForm.lieuNaissance') }}</span>
                        <input pInputText
                            [ngModel]="draft().lieuNaissance" (ngModelChange)="patch('lieuNaissance', $event)"
                            name="lieuNaissance" />
                    </label>

                    <div class="ef-field ef-field--tiny">
                        <span class="ef-label">{{ t('eleveForm.groupeSanguin') }}</span>
                        <p-select
                            [options]="bloodGroups" optionLabel="label" optionValue="value"
                            [showClear]="true" [placeholder]="t('eleveForm.groupeSanguinPlaceholder')"
                            [ngModel]="draft().groupeSanguin" (ngModelChange)="patch('groupeSanguin', $event)"
                            name="groupeSanguin" appendTo="body">
                        </p-select>
                    </div>
                </div>

                <label class="ef-toggle">
                    <p-checkbox [binary]="true"
                        [ngModel]="draft().apteSport" (ngModelChange)="patch('apteSport', $event)"
                        name="apteSport" inputId="apteSport">
                    </p-checkbox>
                    <span class="ef-toggle__text">
                        <span class="ef-toggle__title">{{ t('eleveForm.apteAuSport.titre') }}</span>
                        <span class="ef-toggle__hint">{{ t('eleveForm.apteAuSport.hint') }}</span>
                    </span>
                </label>

                <!-- ─── 2. Affectation scolaire ─── -->
                <div class="ef-section">
                    <span class="ef-section__num" aria-hidden="true">2</span>
                    <h2 class="ef-section__title">{{ t('eleveForm.sections.affectation') }}</h2>
                    <span class="ef-section__hint">{{ anneeScolaire }}</span>
                    <span class="ef-section__rule" aria-hidden="true"></span>
                </div>

                <!-- Sous-système FR / EN : cards visuelles (jamais un <select>) -->
                <fieldset class="ef-subsystem">
                    <legend class="ef-label">{{ t('eleveForm.sousSysteme.label') }}</legend>
                    <div class="ef-subsystem__options">
                        @for (sub of sousSystems; track sub.value) {
                            <button type="button" class="ef-subsystem__card"
                                [class.ef-subsystem__card--on]="draft().sousSysteme === sub.value"
                                [attr.aria-pressed]="draft().sousSysteme === sub.value"
                                (click)="patch('sousSysteme', sub.value)">
                                <span class="ef-subsystem__pill">{{ sub.code }}</span>
                                <span class="ef-subsystem__text">
                                    <span class="ef-subsystem__name">{{ t('eleveForm.sousSysteme.' + sub.value) }}</span>
                                    <span class="ef-subsystem__meta">{{ t('eleveForm.sousSystemeRange.' + sub.value) }}</span>
                                </span>
                                @if (draft().sousSysteme === sub.value) {
                                    <i class="pi pi-check ef-subsystem__check" aria-hidden="true"></i>
                                }
                            </button>
                        }
                    </div>
                </fieldset>

                <div class="ef-row">
                    <div class="ef-field ef-field--wide" [class]="cls('classeId')">
                        <span class="ef-label">
                            {{ t('eleveForm.classe') }} <span class="ef-req">*</span>
                        </span>
                        @if (loadingClasses()) {
                            <span class="ef-help">{{ t('eleveForm.chargementClasses') }}</span>
                        } @else {
                            <p-select
                                [options]="classOptions()"
                                optionLabel="label" optionValue="value"
                                [placeholder]="t('eleveForm.classePlaceholder')"
                                [filter]="true" [filterPlaceholder]="t('eleveForm.classePlaceholder')"
                                [ngModel]="draft().classeId" (ngModelChange)="patch('classeId', $event)"
                                name="classeId" appendTo="body">
                            </p-select>
                        }
                    </div>

                    <label class="ef-toggle ef-toggle--inline">
                        <p-checkbox [binary]="true"
                            [ngModel]="draft().redoublant" (ngModelChange)="patch('redoublant', $event)"
                            name="redoublant" inputId="redoublant">
                        </p-checkbox>
                        <span class="ef-toggle__text">
                            <span class="ef-toggle__title">{{ t('eleveForm.redoublant.titre') }}</span>
                            <span class="ef-toggle__hint">{{ t('eleveForm.redoublant.hint') }}</span>
                        </span>
                    </label>
                </div>

                <!-- ─── 3. Filiation & contact ─── -->
                <div class="ef-section">
                    <span class="ef-section__num" aria-hidden="true">3</span>
                    <h2 class="ef-section__title">{{ t('eleveForm.sections.filiation') }}</h2>
                    <span class="ef-section__rule" aria-hidden="true"></span>
                </div>

                <div class="ef-row">
                    <label class="ef-field ef-field--wide">
                        <span class="ef-label">{{ t('eleveForm.nomPere') }}</span>
                        <input pInputText
                            [ngModel]="draft().nomPere" (ngModelChange)="patch('nomPere', $event)"
                            name="nomPere" />
                    </label>
                    <label class="ef-field ef-field--wide">
                        <span class="ef-label">{{ t('eleveForm.nomMere') }}</span>
                        <input pInputText
                            [ngModel]="draft().nomMere" (ngModelChange)="patch('nomMere', $event)"
                            name="nomMere" />
                    </label>
                </div>

                <div class="ef-row">
                    <label class="ef-field ef-field--medium">
                        <span class="ef-label">{{ t('eleveForm.quartier') }}</span>
                        <input pInputText
                            [ngModel]="draft().quartier" (ngModelChange)="patch('quartier', $event)"
                            name="quartier" />
                    </label>
                    <label class="ef-field ef-field--wide">
                        <span class="ef-label">{{ t('eleveForm.personneContact') }}</span>
                        <input pInputText
                            [ngModel]="draft().personneContact" (ngModelChange)="patch('personneContact', $event)"
                            name="personneContact" />
                    </label>
                    <label class="ef-field ef-field--phone">
                        <span class="ef-label">{{ t('eleveForm.telephoneContact') }}</span>
                        <input pInputText type="tel" inputmode="tel" autocomplete="tel"
                            [ngModel]="draft().telephoneContact" (ngModelChange)="patch('telephoneContact', $event)"
                            name="telephoneContact" />
                    </label>
                </div>

                @if (saveError()) {
                    <p-message severity="error" [text]="saveError()!"></p-message>
                }

            </div><!-- /ef-body -->
            }<!-- /else -->

        </form><!-- /ef-form -->

        <!-- ═══════════════ Rail récapitulatif ═══════════════ -->
        <aside class="ef-rail">
            <app-eleve-summary-rail
                [nom]="draft().nom"
                [prenom]="draft().prenom"
                [sexeLabel]="currentSexeLabel()"
                [sousSystemeLabel]="currentSousSystemeLabel()"
                [sousSystemeCode]="currentSousSystemeCode()"
                [classeLabel]="currentClasseLabel()"
                [redoublant]="draft().redoublant"
                [matricule]="matricule()"
                [isEditMode]="isEditMode"
                [checklist]="checklist()"
                [completedCount]="completedCount()"
                [requiredCount]="requiredCount"
                [progress]="progress()"
                [canSubmit]="canSubmit()"
                [blockingLabel]="blockingLabel()"
                [saving]="saving()"
                (create)="onSubmit()"
                (saveDraft)="onSaveDraft()"
                (cancel)="goBack()">
            </app-eleve-summary-rail>
        </aside>

    </div>
    </ng-container>
    `
})
export class EleveForm implements OnInit {

    protected router        = inject(Router);
    private route           = inject(ActivatedRoute);
    private eleveService    = inject(EleveService);
    private http            = inject(HttpClient);
    private transloco       = inject(TranslocoService);

    private readonly activeLang = toSignal(this.transloco.langChanges$, {
        initialValue: this.transloco.getActiveLang()
    });

    readonly isEditMode = !!this.route.snapshot.paramMap.get('id');
    private readonly eleveId = this.route.snapshot.paramMap.get('id');

    // ── État ──────────────────────────────────────────────────────────────

    readonly draft        = signal<EleveDraft>(emptyDraft());
    readonly allClasses   = signal<ClasseApiItem[]>([]);
    readonly matricule    = signal<string | null>(null);
    readonly loadingEleve = signal(false);
    readonly loadError    = signal(false);
    readonly loadingClasses = signal(false);
    readonly saving       = signal(false);
    readonly saveError    = signal<string | null>(null);
    readonly draftSavedAt = signal<string | null>(null);

    readonly maxDate = new Date();

    // ── Constantes exposées au template ───────────────────────────────────

    protected readonly sousSystems = SOUS_SYSTEMES;
    protected readonly bloodGroups = BLOOD_GROUPS;
    protected readonly requiredCount = REQUIRED_FIELD_KEYS.length;

    protected readonly anneeScolaire = (() => {
        const now = new Date();
        const y = now.getFullYear();
        return now.getMonth() >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
    })();

    // ── Options réactives à la langue ─────────────────────────────────────

    protected readonly sexOptions = computed(() => {
        const _ = this.activeLang();
        return [
            { value: 'M', label: this.transloco.translate('app.eleveForm.sexe.M') },
            { value: 'F', label: this.transloco.translate('app.eleveForm.sexe.F') },
        ];
    });

    /** Classes filtrées par sous-système sélectionné. */
    protected readonly classOptions = computed(() => {
        const ss = this.draft().sousSysteme;
        const all = this.allClasses();
        return (ss ? all.filter(c => c.sousSysteme === ss) : all)
            .map(c => ({ value: c.id, label: c.libelle }));
    });

    // ── Checklist & progression ──────────────────────────────────────────

    private readonly filled = computed<FilledMap>(() => {
        const d = this.draft();
        return {
            nom:           d.nom.trim().length > 0,
            prenom:        d.prenom.trim().length > 0,
            sexe:          d.sexe !== null,
            dateNaissance: d.dateNaissance !== null,
            classeId:      d.classeId !== null,
        };
    });

    protected readonly checklist = computed<readonly ChecklistRow[]>(() => {
        const _ = this.activeLang();
        const f = this.filled();
        return REQUIRED_FIELD_KEYS.map(rf => ({
            label: this.transloco.translate('app.' + rf.labelKey),
            done:  f[rf.key] === true,
        }));
    });

    protected readonly completedCount = computed(() =>
        this.checklist().filter(r => r.done).length
    );

    protected readonly progress = computed(() =>
        Math.round((this.completedCount() / this.requiredCount) * 100)
    );

    protected readonly canSubmit = computed(() =>
        this.completedCount() === this.requiredCount
    );

    /** Premier champ obligatoire manquant — affiché en warning dans le rail. */
    protected readonly blockingLabel = computed<string | null>(() =>
        this.checklist().find(r => !r.done)?.label ?? null
    );

    // ── Données pour la preview du rail ──────────────────────────────────

    protected readonly currentSexeLabel = computed<string | null>(() => {
        const s = this.draft().sexe;
        if (!s) return null;
        const _ = this.activeLang();
        return this.transloco.translate('app.eleveForm.sexe.' + s);
    });

    protected readonly currentSousSystemeLabel = computed<string | null>(() => {
        const ss = this.draft().sousSysteme;
        if (!ss) return null;
        const _ = this.activeLang();
        return this.transloco.translate('app.eleveForm.sousSysteme.' + ss);
    });

    protected readonly currentSousSystemeCode = computed<string | null>(() => {
        const ss = this.draft().sousSysteme;
        return ss ? SOUS_SYSTEMES.find(s => s.value === ss)?.code ?? null : null;
    });

    protected readonly currentClasseLabel = computed<string | null>(() => {
        const id = this.draft().classeId;
        if (!id) return null;
        return this.allClasses().find(c => c.id === id)?.libelle ?? null;
    });

    // ── Classe CSS de validation par champ ───────────────────────────────

    /** Retourne 'ef-ok' (vert) si renseigné, 'ef-blocking' (orange) si c'est
     *  le premier champ obligatoire manquant, '' sinon. */
    protected cls(key: string): string {
        const f = this.filled();
        const classes: string[] = [];
        if (f[key] === true) {
            classes.push('ef-ok');
        } else if (REQUIRED_FIELD_KEYS.some(rf => rf.key === key)) {
            const firstMissing = REQUIRED_FIELD_KEYS.find(rf => !f[rf.key]);
            if (firstMissing?.key === key) classes.push('ef-blocking');
        }
        return classes.join(' ');
    }

    // ── Mise à jour du brouillon ──────────────────────────────────────────

    protected patch<K extends keyof EleveDraft>(key: K, value: EleveDraft[K]): void {
        const next = { ...this.draft(), [key]: value };
        // Changer de sous-système invalide la classe (listes disjointes).
        if (key === 'sousSysteme') next.classeId = null;
        this.draft.set(next);
    }

    // ── Cycle de vie ─────────────────────────────────────────────────────

    ngOnInit(): void {
        this.loadClasses();
        if (this.isEditMode && this.eleveId) {
            this.loadEleve(this.eleveId);
        }
    }

    private loadClasses(): void {
        this.loadingClasses.set(true);
        const p = new HttpParams().set('page', '0').set('size', '200').set('sort', 'libelle,asc');
        this.http.get<{ content: ClasseApiItem[] }>('/api/classes', { params: p }).subscribe({
            next: (res) => {
                this.allClasses.set(res.content ?? []);
                this.loadingClasses.set(false);
            },
            error: () => this.loadingClasses.set(false),
        });
    }

    private loadEleve(id: string): void {
        this.loadingEleve.set(true);
        this.eleveService.getById(id).subscribe({
            next: (e) => {
                this.matricule.set(e.matricule);
                this.draft.set({
                    nom:              e.nom,
                    prenom:           e.prenom,
                    sexe:             e.sexe,
                    dateNaissance:    e.dateNaissance ? new Date(e.dateNaissance) : null,
                    lieuNaissance:    e.lieuNaissance    ?? '',
                    groupeSanguin:    e.groupeSanguin    ?? null,
                    sousSysteme:      (e.sousSysteme as SousSysteme | undefined) ?? null,
                    classeId:         e.classeId,
                    redoublant:       e.redoublant,
                    apteSport:        e.apteSport,
                    nomPere:          e.nomPere          ?? '',
                    nomMere:          e.nomMere          ?? '',
                    quartier:         e.quartier         ?? '',
                    personneContact:  e.personneContact  ?? '',
                    telephoneContact: e.telephoneContact ?? '',
                });
                this.loadingEleve.set(false);
            },
            error: () => {
                this.loadError.set(true);
                this.loadingEleve.set(false);
            },
        });
    }

    // ── Actions ──────────────────────────────────────────────────────────

    protected goBack(): void {
        this.router.navigate(['/app/eleves']);
    }

    protected onSaveDraft(): void {
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        this.draftSavedAt.set(this.transloco.translate('app.eleveForm.brouillonSauvegarde', { time }));
    }

    protected onSubmit(): void {
        if (!this.canSubmit()) return;
        this.saving.set(true);
        this.saveError.set(null);

        const d = this.draft();
        const payload: EleveRequest = {
            nom:           d.nom.trim(),
            prenom:        d.prenom.trim(),
            sexe:          d.sexe!,
            dateNaissance: this.formatDate(d.dateNaissance!),
            classeId:      d.classeId!,
        };
        if (d.lieuNaissance.trim())    payload.lieuNaissance    = d.lieuNaissance.trim();
        if (d.redoublant !== undefined) payload.redoublant       = d.redoublant;
        if (d.sousSysteme)             payload.sousSysteme      = d.sousSysteme;
        if (d.apteSport !== undefined)  payload.apteSport       = d.apteSport;
        if (d.groupeSanguin)           payload.groupeSanguin    = d.groupeSanguin;
        if (d.nomPere.trim())          payload.nomPere          = d.nomPere.trim();
        if (d.nomMere.trim())          payload.nomMere          = d.nomMere.trim();
        if (d.quartier.trim())         payload.quartier         = d.quartier.trim();
        if (d.personneContact.trim())  payload.personneContact  = d.personneContact.trim();
        if (d.telephoneContact.trim()) payload.telephoneContact = d.telephoneContact.trim();

        const req$ = this.isEditMode && this.eleveId
            ? this.eleveService.modifier(this.eleveId, payload)
            : this.eleveService.creer(payload);

        req$.subscribe({
            next: () => { this.saving.set(false); this.goBack(); },
            error: (err) => {
                this.saving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.saveError.set(
                    typeof msg === 'string'
                        ? msg
                        : this.transloco.translate('app.eleveForm.erreurEnregistrement')
                );
            },
        });
    }

    private formatDate(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const j = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${j}`;
    }
}
