import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { VitrineService } from '@/app/core/services/vitrine.service';

@Component({
    selector: 'app-actualite-form',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule, RouterModule, TranslocoDirective,
        ButtonModule, InputTextModule, TextareaModule, DatePickerModule,
        ToggleSwitchModule, MessageModule, FluidModule
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <!-- En-tête -->
            <div class="flex items-center gap-3 mb-5">
                <button pButton severity="secondary" icon="pi pi-arrow-left"
                    (click)="router.navigate(['/app/communication/actualites'])"></button>
                <h2 class="text-xl font-semibold m-0">
                    {{ isEditMode ? t('communication.actualites.form.titreEdition') : t('communication.actualites.form.titreCreation') }}
                </h2>
            </div>

            @if (loadingItem()) {
                <div class="flex justify-center py-10">
                    <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:var(--p-primary-color)"></i>
                </div>
            } @else if (loadError()) {
                <p-message severity="error" [text]="t('communication.commun.erreurChargement')"></p-message>
            } @else {
                <form [formGroup]="form" (ngSubmit)="onSubmit()">
                    <p-fluid>
                        <div class="flex flex-col gap-5" style="max-width:800px">
                            <!-- Titre -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">
                                    {{ t('communication.actualites.form.titre') }}
                                    <span style="color:var(--color-danger)">*</span>
                                </label>
                                <input pInputText formControlName="titre"
                                    [placeholder]="t('communication.actualites.form.titrePh')" />
                                @if (form.controls['titre'].invalid && form.controls['titre'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('communication.commun.requis') }}</small>
                                }
                            </div>

                            <!-- Contenu -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">
                                    {{ t('communication.actualites.form.contenu') }}
                                    <span style="color:var(--color-danger)">*</span>
                                </label>
                                <textarea pTextarea formControlName="contenu" rows="10"
                                    [placeholder]="t('communication.actualites.form.contenuPh')"
                                    style="resize:vertical"></textarea>
                                @if (form.controls['contenu'].invalid && form.controls['contenu'].touched) {
                                    <small style="color:var(--color-danger)">{{ t('communication.commun.requis') }}</small>
                                }
                            </div>

                            <!-- Date de publication + Publier -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="flex flex-col gap-1">
                                    <label class="font-semibold text-sm">
                                        {{ t('communication.actualites.form.datePublication') }}
                                        <span style="color:var(--color-danger)">*</span>
                                    </label>
                                    <p-datepicker formControlName="datePublication"
                                        dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body">
                                    </p-datepicker>
                                    @if (form.controls['datePublication'].invalid && form.controls['datePublication'].touched) {
                                        <small style="color:var(--color-danger)">{{ t('communication.commun.requis') }}</small>
                                    }
                                </div>

                                <div class="flex flex-col gap-2 justify-center">
                                    <label class="font-semibold text-sm">{{ t('communication.actualites.form.publie') }}</label>
                                    <div class="flex items-center gap-3">
                                        <p-toggleswitch formControlName="publie"></p-toggleswitch>
                                        <small class="text-surface-500">{{ t('communication.actualites.form.publieHint') }}</small>
                                    </div>
                                </div>
                            </div>

                            <!-- Image URL + aperçu -->
                            <div class="flex flex-col gap-1">
                                <label class="font-semibold text-sm">{{ t('communication.actualites.form.imageUrl') }}</label>
                                <input pInputText formControlName="imageUrl"
                                    [placeholder]="t('communication.actualites.form.imageUrlPh')"
                                    (input)="onImageUrlInput($event)" />
                                <small class="text-surface-400">{{ t('communication.actualites.form.imageUrlHint') }}</small>
                                @if (imagePreview()) {
                                    <div style="margin-top:6px;border-radius:10px;overflow:hidden;
                                                border:1px solid var(--p-surface-200);max-height:180px">
                                        <img [src]="imagePreview()"
                                             alt="Aperçu"
                                             style="width:100%;height:180px;object-fit:cover;display:block"
                                             (error)="imagePreview.set('')">
                                    </div>
                                }
                            </div>

                            <!-- Hint format contenu -->
                            <div class="flex flex-col gap-1">
                                <small class="text-surface-400">{{ t('communication.actualites.form.contenuHint') }}</small>
                            </div>

                            @if (saveError()) {
                                <p-message severity="error" [text]="saveError()!"></p-message>
                            }

                            <!-- Actions -->
                            <div class="flex gap-2">
                                <button pButton severity="secondary"
                                    [label]="t('communication.commun.annuler')"
                                    [disabled]="saving()"
                                    (click)="router.navigate(['/app/communication/actualites'])">
                                </button>
                                <button pButton type="submit"
                                    [label]="isEditMode ? t('communication.commun.modifier') : t('communication.commun.creer')"
                                    [loading]="saving()">
                                </button>
                            </div>
                        </div>
                    </p-fluid>
                </form>
            }
        </div>
    </ng-container>
    `
})
export class ActualiteForm implements OnInit {
    readonly router = inject(Router);
    private route   = inject(ActivatedRoute);
    private svc     = inject(VitrineService);
    private fb      = inject(FormBuilder);
    private t9n     = inject(TranslocoService);

    readonly loadingItem  = signal(false);
    readonly loadError    = signal(false);
    readonly saving       = signal(false);
    readonly saveError    = signal<string | null>(null);
    readonly imagePreview = signal<string>('');

    isEditMode = false;
    private editId: string | null = null;

    readonly form = this.fb.group({
        titre:           ['', Validators.required],
        contenu:         ['', Validators.required],
        datePublication: [new Date() as Date | null, Validators.required],
        imageUrl:        [''],
        publie:          [false]   // défaut brouillon — évite toute publication accidentelle
    });

    ngOnInit(): void {
        this.editId = this.route.snapshot.paramMap.get('id');
        this.isEditMode = !!this.editId;

        if (this.isEditMode && this.editId) {
            this.loadingItem.set(true);
            this.svc.getActualiteById(this.editId).subscribe({
                next: item => {
                    this.form.patchValue({
                        titre:           item.titre,
                        contenu:         item.contenu,
                        datePublication: item.datePublication ? new Date(item.datePublication + 'T00:00:00') : null,
                        imageUrl:        item.imageUrl ?? '',
                        publie:          item.publie
                    });
                    this.imagePreview.set(item.imageUrl ?? '');
                    this.loadingItem.set(false);
                },
                error: () => {
                    this.loadError.set(true);
                    this.loadingItem.set(false);
                }
            });
        }
    }

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) return;

        this.saving.set(true);
        this.saveError.set(null);

        const v = this.form.getRawValue();
        const req = {
            titre:           v.titre!.trim(),
            contenu:         v.contenu!.trim(),
            datePublication: this.formatDate(v.datePublication!),
            imageUrl:        v.imageUrl?.trim() || undefined,
            publie:          v.publie ?? true
        };

        const req$ = this.isEditMode && this.editId
            ? this.svc.modifierActualite(this.editId, req)
            : this.svc.creerActualite(req);

        req$.subscribe({
            next: () => {
                this.saving.set(false);
                this.router.navigate(['/app/communication/actualites'], {
                    state: { successAction: this.isEditMode ? 'modified' : 'created' }
                });
            },
            error: err => {
                this.saving.set(false);
                const msg = err?.error?.message ?? null;
                this.saveError.set(typeof msg === 'string' ? msg : this.t9n.translate('app.communication.commun.erreurEnregistrement'));
            }
        });
    }

    onImageUrlInput(event: Event): void {
        const val = (event.target as HTMLInputElement).value.trim();
        this.imagePreview.set(val.startsWith('http') ? val : '');
    }

    private formatDate(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const j = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${j}`;
    }
}
