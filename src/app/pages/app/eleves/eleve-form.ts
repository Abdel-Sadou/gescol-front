import {
    Component, inject, signal, computed, OnInit
} from '@angular/core';
import {
    FormBuilder, FormGroup, Validators, ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService, TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { MessageModule } from 'primeng/message';
import { EleveService, EleveRequest } from '@/app/core/services/eleve.service';

interface ClasseOption { value: string; label: string; }

@Component({
    selector: 'app-eleve-form',
    standalone: true,
    imports: [
        ReactiveFormsModule, RouterModule, TranslocoDirective,
        ButtonModule, InputTextModule, SelectModule, DatePickerModule,
        CheckboxModule, FloatLabelModule, FluidModule, MessageModule
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <!-- En-tête -->
            <div class="flex items-center gap-3 mb-5">
                <button pButton icon="pi pi-arrow-left" class="p-button-text p-button-secondary"
                    (click)="router.navigate(['/app/eleves'])"></button>
                <h2 class="text-xl font-semibold m-0">
                    {{ isEditMode ? t('eleveForm.titreEdition') : t('eleveForm.titreCreation') }}
                </h2>
            </div>

            <!-- Matricule (lecture seule en édition) -->
            @if (isEditMode && matricule()) {
                <div class="mb-5 p-3 surface-100 border-round flex items-center gap-2">
                    <span class="font-semibold text-surface-600">{{ t('eleveForm.matriculeLabel') }} :</span>
                    <span class="font-bold">{{ matricule() }}</span>
                </div>
            }

            <!-- Chargement / Erreur initial -->
            @if (loadingEleve()) {
                <div class="flex justify-center py-10">
                    <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:var(--p-primary-color)"></i>
                </div>
            } @else if (loadError()) {
                <p-message severity="error" [text]="t('eleveForm.erreurChargement')"></p-message>
            } @else {
                <form [formGroup]="form" (ngSubmit)="onSubmit()">
                    <!-- Formulaire 2 colonnes -->
                    <p-fluid>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                            <!-- Nom * -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.nom') }} <span class="text-red-500">*</span></label>
                                <input pInputText formControlName="nom" [placeholder]="t('eleveForm.nom')" />
                                @if (f['nom'].invalid && f['nom'].touched) {
                                    <small class="text-red-500">{{ t('eleveForm.validation.requis') }}</small>
                                }
                            </div>

                            <!-- Prénom * -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.prenom') }} <span class="text-red-500">*</span></label>
                                <input pInputText formControlName="prenom" [placeholder]="t('eleveForm.prenom')" />
                                @if (f['prenom'].invalid && f['prenom'].touched) {
                                    <small class="text-red-500">{{ t('eleveForm.validation.requis') }}</small>
                                }
                            </div>

                            <!-- Sexe * -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.sexe.label') }} <span class="text-red-500">*</span></label>
                                <p-select formControlName="sexe"
                                    [options]="sexeOptions()"
                                    optionLabel="label"
                                    optionValue="value"
                                    [placeholder]="t('eleveForm.sexe.placeholder')">
                                </p-select>
                                @if (f['sexe'].invalid && f['sexe'].touched) {
                                    <small class="text-red-500">{{ t('eleveForm.validation.requis') }}</small>
                                }
                            </div>

                            <!-- Date de naissance * -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.dateNaissance') }} <span class="text-red-500">*</span></label>
                                <p-datepicker formControlName="dateNaissance"
                                    dateFormat="dd/mm/yy"
                                    [maxDate]="maxDate"
                                    [showIcon]="true">
                                </p-datepicker>
                                @if (f['dateNaissance'].invalid && f['dateNaissance'].touched) {
                                    <small class="text-red-500">{{ t('eleveForm.validation.dateRequise') }}</small>
                                }
                            </div>

                            <!-- Lieu de naissance -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.lieuNaissance') }}</label>
                                <input pInputText formControlName="lieuNaissance" [placeholder]="t('eleveForm.lieuNaissance')" />
                            </div>

                            <!-- Classe * -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.classe') }} <span class="text-red-500">*</span></label>
                                @if (loadingClasses()) {
                                    <span class="text-surface-400 text-sm">{{ t('eleveForm.chargementClasses') }}</span>
                                } @else {
                                    <p-select formControlName="classeId"
                                        [options]="classeOptions()"
                                        optionLabel="label"
                                        optionValue="value"
                                        [placeholder]="t('eleveForm.classePlaceholder')"
                                        [filter]="true">
                                    </p-select>
                                }
                                @if (f['classeId'].invalid && f['classeId'].touched) {
                                    <small class="text-red-500">{{ t('eleveForm.validation.requis') }}</small>
                                }
                            </div>

                            <!-- Sous-système -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.sousSysteme.label') }}</label>
                                <p-select formControlName="sousSysteme"
                                    [options]="sousSystemeOptions()"
                                    optionLabel="label"
                                    optionValue="value"
                                    [showClear]="true"
                                    [placeholder]="t('eleveForm.sousSysteme.placeholder')">
                                </p-select>
                            </div>

                            <!-- Groupe sanguin -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.groupeSanguin') }}</label>
                                <p-select formControlName="groupeSanguin"
                                    [options]="groupesSanguins"
                                    optionLabel="label"
                                    optionValue="value"
                                    [showClear]="true"
                                    [placeholder]="t('eleveForm.groupeSanguinPlaceholder')">
                                </p-select>
                            </div>

                            <!-- Nom du père -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.nomPere') }}</label>
                                <input pInputText formControlName="nomPere" [placeholder]="t('eleveForm.nomPere')" />
                            </div>

                            <!-- Nom de la mère -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.nomMere') }}</label>
                                <input pInputText formControlName="nomMere" [placeholder]="t('eleveForm.nomMere')" />
                            </div>

                            <!-- Quartier -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.quartier') }}</label>
                                <input pInputText formControlName="quartier" [placeholder]="t('eleveForm.quartier')" />
                            </div>

                            <!-- Personne à contacter -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.personneContact') }}</label>
                                <input pInputText formControlName="personneContact" [placeholder]="t('eleveForm.personneContact')" />
                            </div>

                            <!-- Téléphone contact -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('eleveForm.telephoneContact') }}</label>
                                <input pInputText formControlName="telephoneContact" [placeholder]="t('eleveForm.telephoneContact')" />
                            </div>
                        </div>

                        <!-- Cases à cocher sur une ligne -->
                        <div class="flex gap-6 mt-5">
                            <div class="flex items-center gap-2">
                                <p-checkbox formControlName="redoublant" [binary]="true" inputId="redoublant"></p-checkbox>
                                <label for="redoublant">{{ t('eleveForm.redoublant') }}</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <p-checkbox formControlName="apteSport" [binary]="true" inputId="apteSport"></p-checkbox>
                                <label for="apteSport">{{ t('eleveForm.apteSport') }}</label>
                            </div>
                        </div>
                    </p-fluid>

                    <!-- Erreur API -->
                    @if (saveError()) {
                        <div class="mt-4">
                            <p-message severity="error" [text]="saveError()!"></p-message>
                        </div>
                    }

                    <!-- Actions -->
                    <div class="flex justify-end gap-3 mt-6">
                        <button pButton type="button" [label]="t('eleveForm.annuler')"
                            class="p-button-text p-button-secondary"
                            [disabled]="saving()"
                            (click)="router.navigate(['/app/eleves'])"></button>
                        <button pButton type="submit" icon="pi pi-check"
                            [label]="isEditMode ? t('eleveForm.modifier') : t('eleveForm.creer')"
                            [loading]="saving()"
                            [disabled]="saving()"></button>
                    </div>
                </form>
            }
        </div>
    </ng-container>
    `
})
export class EleveForm implements OnInit {
    protected router       = inject(Router);
    private route          = inject(ActivatedRoute);
    private fb             = inject(FormBuilder);
    private eleveService   = inject(EleveService);
    private http           = inject(HttpClient);
    private transloco      = inject(TranslocoService);

    private activeLang = toSignal(this.transloco.langChanges$, {
        initialValue: this.transloco.getActiveLang()
    });

    readonly isEditMode = !!this.route.snapshot.paramMap.get('id');
    private readonly eleveId = this.route.snapshot.paramMap.get('id');

    readonly matricule    = signal<string | null>(null);
    readonly loadingEleve = signal(false);
    readonly loadError    = signal(false);
    readonly loadingClasses = signal(false);
    readonly classeOptions  = signal<ClasseOption[]>([]);
    readonly saving       = signal(false);
    readonly saveError    = signal<string | null>(null);

    readonly maxDate = new Date();

    readonly form: FormGroup = this.fb.group({
        nom:              ['', Validators.required],
        prenom:           ['', Validators.required],
        sexe:             [null, Validators.required],
        dateNaissance:    [null, Validators.required],
        lieuNaissance:    [''],
        classeId:         [null, Validators.required],
        redoublant:       [false],
        sousSysteme:      [null],
        apteSport:        [true],
        groupeSanguin:    [null],
        nomPere:          [''],
        nomMere:          [''],
        quartier:         [''],
        personneContact:  [''],
        telephoneContact: ['']
    });

    get f() { return this.form.controls; }

    readonly sexeOptions = computed(() => {
        const _ = this.activeLang();
        return [
            { value: 'M', label: this.transloco.translate('app.eleveForm.sexe.M') },
            { value: 'F', label: this.transloco.translate('app.eleveForm.sexe.F') }
        ];
    });

    readonly sousSystemeOptions = computed(() => {
        const _ = this.activeLang();
        return [
            { value: 'FRANCOPHONE', label: this.transloco.translate('app.eleveForm.sousSysteme.FRANCOPHONE') },
            { value: 'ANGLOPHONE',  label: this.transloco.translate('app.eleveForm.sousSysteme.ANGLOPHONE') }
        ];
    });

    readonly groupesSanguins = [
        { value: 'A_POSITIF',  label: 'A+' },
        { value: 'A_NEGATIF',  label: 'A-' },
        { value: 'B_POSITIF',  label: 'B+' },
        { value: 'B_NEGATIF',  label: 'B-' },
        { value: 'AB_POSITIF', label: 'AB+' },
        { value: 'AB_NEGATIF', label: 'AB-' },
        { value: 'O_POSITIF',  label: 'O+' },
        { value: 'O_NEGATIF',  label: 'O-' }
    ];

    ngOnInit(): void {
        this.loadClasses();
        if (this.isEditMode && this.eleveId) {
            this.loadEleve(this.eleveId);
        }
    }

    private loadClasses(): void {
        this.loadingClasses.set(true);
        const p = new HttpParams().set('page', '0').set('size', '200').set('sort', 'libelle,asc');
        this.http.get<{ content: { id: string; libelle: string }[] }>('/api/classes', { params: p })
            .subscribe({
                next: (res) => {
                    this.classeOptions.set(res.content.map(c => ({ value: c.id, label: c.libelle })));
                    this.loadingClasses.set(false);
                },
                error: () => this.loadingClasses.set(false)
            });
    }

    private loadEleve(id: string): void {
        this.loadingEleve.set(true);
        this.eleveService.getById(id).subscribe({
            next: (e) => {
                this.matricule.set(e.matricule);
                const dateNaissance = e.dateNaissance ? new Date(e.dateNaissance) : null;
                this.form.patchValue({
                    nom: e.nom, prenom: e.prenom, sexe: e.sexe,
                    dateNaissance,
                    lieuNaissance:    e.lieuNaissance ?? '',
                    classeId:         e.classeId,
                    redoublant:       e.redoublant,
                    sousSysteme:      e.sousSysteme ?? null,
                    apteSport:        e.apteSport,
                    groupeSanguin:    e.groupeSanguin ?? null,
                    nomPere:          e.nomPere ?? '',
                    nomMere:          e.nomMere ?? '',
                    quartier:         e.quartier ?? '',
                    personneContact:  e.personneContact ?? '',
                    telephoneContact: e.telephoneContact ?? ''
                });
                this.loadingEleve.set(false);
            },
            error: () => {
                this.loadError.set(true);
                this.loadingEleve.set(false);
            }
        });
    }

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) return;

        this.saving.set(true);
        this.saveError.set(null);

        const v = this.form.getRawValue();
        const payload: EleveRequest = {
            nom:    v.nom.trim(),
            prenom: v.prenom.trim(),
            sexe:   v.sexe,
            dateNaissance: this.formatDate(v.dateNaissance),
            classeId: v.classeId
        };

        if (v.lieuNaissance?.trim())   payload.lieuNaissance   = v.lieuNaissance.trim();
        if (v.redoublant !== undefined) payload.redoublant      = v.redoublant;
        if (v.sousSysteme)             payload.sousSysteme      = v.sousSysteme;
        if (v.apteSport !== undefined)  payload.apteSport       = v.apteSport;
        if (v.groupeSanguin)           payload.groupeSanguin    = v.groupeSanguin;
        if (v.nomPere?.trim())         payload.nomPere          = v.nomPere.trim();
        if (v.nomMere?.trim())         payload.nomMere          = v.nomMere.trim();
        if (v.quartier?.trim())        payload.quartier         = v.quartier.trim();
        if (v.personneContact?.trim()) payload.personneContact  = v.personneContact.trim();
        if (v.telephoneContact?.trim()) payload.telephoneContact = v.telephoneContact.trim();

        const req$ = this.isEditMode && this.eleveId
            ? this.eleveService.modifier(this.eleveId, payload)
            : this.eleveService.creer(payload);

        req$.subscribe({
            next: () => {
                this.saving.set(false);
                this.router.navigate(['/app/eleves']);
            },
            error: (err) => {
                this.saving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.saveError.set(
                    typeof msg === 'string'
                        ? msg
                        : this.transloco.translate('app.eleveForm.erreurEnregistrement')
                );
            }
        });
    }

    private formatDate(d: Date | null): string {
        if (!d) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const j = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${j}`;
    }
}
