import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { ParametrageService } from '@/app/core/services/parametrage.service';

// Variables de substitution reconnues côté backend pour les lettres d'engagement
const VARIABLES_DISPONIBLES = [
    '{{nomEleve}}', '{{prenomEleve}}', '{{classeLibelle}}',
    '{{anneeScolaire}}', '{{nomEtablissement}}', '{{dateConfirmation}}'
];

@Component({
    selector: 'app-modele-engagement-form',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule, RouterModule, TranslocoDirective,
        ButtonModule, InputTextModule, TextareaModule, MessageModule, FluidModule
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card" style="display:flex; flex-direction:column; gap:0">
            <!-- En-tête -->
            <div class="flex items-center gap-3 mb-5">
                <button pButton severity="secondary" icon="pi pi-arrow-left"
                    (click)="router.navigate(['/app/parametrage/modeles-engagement'])"></button>
                <h2 class="text-xl font-semibold m-0">
                    {{ isEditMode ? t('parametrage.modelesEngagement.form.titreEdition') : t('parametrage.modelesEngagement.form.titreCreation') }}
                </h2>
            </div>

            @if (loadingItem()) {
                <div class="flex justify-center py-10">
                    <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:var(--p-primary-color)"></i>
                </div>
            } @else if (loadError()) {
                <p-message severity="error" [text]="t('parametrage.modelesEngagement.erreurChargement')"></p-message>
            } @else {
                <form [formGroup]="form" (ngSubmit)="onSubmit()">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Formulaire (2/3) -->
                        <div class="lg:col-span-2">
                            <p-fluid>
                                <div class="flex flex-col gap-5">
                                    <div class="flex flex-col gap-1">
                                        <label class="font-semibold text-sm">
                                            {{ t('parametrage.modelesEngagement.form.libelle') }}
                                            <span style="color:var(--color-danger)">*</span>
                                        </label>
                                        <input pInputText formControlName="libelle" placeholder="ex. Lettre d'engagement parents 2025-2026" />
                                        @if (form.controls['libelle'].invalid && form.controls['libelle'].touched) {
                                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                        }
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="font-semibold text-sm">
                                            {{ t('parametrage.modelesEngagement.form.contenu') }}
                                            <span style="color:var(--color-danger)">*</span>
                                        </label>
                                        <textarea pTextarea formControlName="contenu"
                                            [rows]="18" [autoResize]="false"
                                            style="resize:vertical; font-family:monospace; font-size:13px">
                                        </textarea>
                                        @if (form.controls['contenu'].invalid && form.controls['contenu'].touched) {
                                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                                        }
                                    </div>
                                    @if (saveError()) {
                                        <p-message severity="error" [text]="saveError()!"></p-message>
                                    }
                                </div>
                            </p-fluid>
                        </div>

                        <!-- Panneau variables (1/3) -->
                        <div>
                            <div style="background:var(--color-surface-sunken); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:1rem; position:sticky; top:1.5rem">
                                <h3 class="text-base font-semibold m-0 mb-2">
                                    {{ t('parametrage.modelesEngagement.form.variables') }}
                                </h3>
                                <p style="color:var(--color-text-muted); font-size:0.8rem; margin:0 0 0.75rem">
                                    {{ t('parametrage.modelesEngagement.form.variablesHint') }}
                                </p>
                                <div class="flex flex-col gap-2">
                                    @for (v of variables; track v) {
                                        <code style="display:block; font-size:0.8rem; padding:0.4rem 0.6rem; background:var(--color-canvas); border:1px solid var(--color-border); border-radius:var(--radius-sm); word-break:break-all; cursor:pointer; user-select:all"
                                            [title]="v">{{ v }}</code>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            }

            <!-- Barre d'action ancrée en bas -->
            @if (!loadingItem() && !loadError()) {
                <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:0.75rem 1.25rem; margin:1.5rem -1.25rem -1.25rem; background:var(--color-surface-sunken); border-top:1px solid var(--color-border); border-radius:0 0 var(--radius-md) var(--radius-md); flex-wrap:wrap">
                    <span style="font-size:0.8rem; color:var(--color-text-muted)">
                        {{ t('parametrage.modelesEngagement.form.variablesHint') }}
                    </span>
                    <div style="display:flex; gap:0.5rem; margin-left:auto">
                        <button pButton type="button" severity="secondary"
                            [label]="t('parametrage.modelesEngagement.annuler')"
                            [disabled]="saving()"
                            (click)="router.navigate(['/app/parametrage/modeles-engagement'])"></button>
                        <button pButton type="button" icon="pi pi-check"
                            [label]="isEditMode ? t('parametrage.modelesEngagement.modifier') : t('parametrage.modelesEngagement.creer')"
                            [loading]="saving()"
                            [disabled]="saving()"
                            (click)="onSubmit()"></button>
                    </div>
                </div>
            }
        </div>
    </ng-container>
    `
})
export class ModeleEngagementForm implements OnInit {
    protected router  = inject(Router);
    private route     = inject(ActivatedRoute);
    private fb        = inject(FormBuilder);
    private svc       = inject(ParametrageService);
    private transloco = inject(TranslocoService);

    readonly isEditMode  = !!this.route.snapshot.paramMap.get('id');
    private readonly itemId = this.route.snapshot.paramMap.get('id');

    readonly loadingItem = signal(false);
    readonly loadError   = signal(false);
    readonly saving      = signal(false);
    readonly saveError   = signal<string | null>(null);

    readonly variables = VARIABLES_DISPONIBLES;

    readonly form = this.fb.group({
        libelle: ['', Validators.required],
        contenu: ['', Validators.required]
    });

    ngOnInit(): void {
        if (this.isEditMode && this.itemId) {
            this.loadingItem.set(true);
            this.svc.getModeleById(this.itemId).subscribe({
                next: (item) => {
                    this.form.patchValue({ libelle: item.libelle, contenu: item.contenu });
                    this.loadingItem.set(false);
                },
                error: () => { this.loadError.set(true); this.loadingItem.set(false); }
            });
        }
    }

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) return;
        this.saving.set(true);
        this.saveError.set(null);
        const v = this.form.getRawValue();
        const req = { libelle: v.libelle!.trim(), contenu: v.contenu! };
        const req$ = this.isEditMode && this.itemId
            ? this.svc.modifierModele(this.itemId, req)
            : this.svc.creerModele(req);
        req$.subscribe({
            next: () => { this.saving.set(false); this.router.navigate(['/app/parametrage/modeles-engagement']); },
            error: (err) => {
                this.saving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.saveError.set(typeof msg === 'string' ? msg : this.transloco.translate('app.parametrage.modelesEngagement.erreurEnregistrement'));
            }
        });
    }
}
