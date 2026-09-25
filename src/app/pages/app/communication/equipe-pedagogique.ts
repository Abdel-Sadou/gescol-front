import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { TableModule } from 'primeng/table';
import { VitrineService, MembreEquipePedagogiqueResponse } from '@/app/core/services/vitrine.service';
import { AuthService } from '@/app/core/services/auth.service';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';

@Component({
    selector: 'app-equipe-pedagogique',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, ReactiveFormsModule, TranslocoDirective,
        ButtonModule, DialogModule, InputTextModule, InputNumberModule,
        MessageModule, FluidModule, TableModule,
        DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">
                    <i class="pi pi-users mr-2" style="color:var(--color-primary)"></i>
                    {{ t('communication.equipe.titre') }}
                </h2>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus"
                        [label]="t('communication.equipe.nouveauMembre')"
                        class="p-button-success"
                        (click)="openCreate()">
                    </button>
                }
            </div>

            @if (loading()) {
                <div class="flex justify-center py-10">
                    <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:var(--p-primary-color)"></i>
                </div>
            } @else if (loadError()) {
                <p-message severity="error" [text]="t('table.erreur')"></p-message>
            } @else {
                <p-table [value]="items()" styleClass="p-datatable-sm" [rowHover]="true">
                    <ng-template #header>
                        <tr>
                            <th style="width:70px;text-align:center">{{ t('communication.equipe.cols.ordre') }}</th>
                            <th>{{ t('communication.equipe.cols.nom') }}</th>
                            <th>{{ t('communication.equipe.cols.fonction') }}</th>
                            @if (canWrite()) {
                                <th style="width:90px;text-align:center">{{ t('table.actions') }}</th>
                            }
                        </tr>
                    </ng-template>
                    <ng-template #body let-row>
                        <tr>
                            <td style="text-align:center">
                                <span class="text-surface-400 font-mono text-sm">{{ row.ordre }}</span>
                            </td>
                            <td>
                                <div class="flex items-center gap-3">
                                    @if (row.photoUrl) {
                                        <img [src]="row.photoUrl" [alt]="row.nom"
                                            style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;">
                                    } @else {
                                        <div style="width:36px;height:36px;border-radius:50%;background:var(--p-surface-100);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                            <i class="pi pi-user text-surface-400" style="font-size:14px"></i>
                                        </div>
                                    }
                                    <span class="font-medium">{{ row.nom }}</span>
                                </div>
                            </td>
                            <td class="text-surface-500">{{ row.fonction }}</td>
                            @if (canWrite()) {
                                <td style="text-align:center">
                                    <div class="flex gap-1 justify-center">
                                        <button pButton icon="pi pi-pencil"
                                            class="p-button-text p-button-sm p-button-success"
                                            (click)="openEdit(row)"></button>
                                        <button pButton icon="pi pi-trash"
                                            class="p-button-text p-button-sm p-button-danger"
                                            (click)="onDelete(row)"></button>
                                    </div>
                                </td>
                            }
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td [attr.colspan]="canWrite() ? 4 : 3" class="text-center py-8 text-surface-400">
                                {{ t('table.aucun') }}
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            }
        </div>

        <!-- Dialog membre -->
        <p-dialog
            [visible]="dialogVisible()" (visibleChange)="onDialogChange($event)"
            [header]="editTarget() ? t('communication.equipe.form.titreEdition') : t('communication.equipe.form.titreCreation')"
            [modal]="true" [style]="{width:'520px'}" [closable]="!saving()"
            appendTo="body">
            <p-fluid>
                <form [formGroup]="form" class="flex flex-col gap-4 mt-1">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1 col-span-2">
                            <label class="font-semibold text-sm">
                                {{ t('communication.equipe.form.nom') }}
                                <span style="color:var(--color-danger)">*</span>
                            </label>
                            <input pInputText formControlName="nom"
                                [placeholder]="t('communication.equipe.form.nomPh')" />
                            @if (form.controls['nom'].invalid && form.controls['nom'].touched) {
                                <small style="color:var(--color-danger)">{{ t('communication.commun.requis') }}</small>
                            }
                        </div>

                        <div class="flex flex-col gap-1 col-span-2">
                            <label class="font-semibold text-sm">
                                {{ t('communication.equipe.form.fonction') }}
                                <span style="color:var(--color-danger)">*</span>
                            </label>
                            <input pInputText formControlName="fonction"
                                [placeholder]="t('communication.equipe.form.fonctionPh')" />
                            @if (form.controls['fonction'].invalid && form.controls['fonction'].touched) {
                                <small style="color:var(--color-danger)">{{ t('communication.commun.requis') }}</small>
                            }
                        </div>

                        <div class="flex flex-col gap-1 col-span-2">
                            <label class="font-semibold text-sm">{{ t('communication.equipe.form.photoUrl') }}</label>
                            <input pInputText formControlName="photoUrl"
                                [placeholder]="t('communication.equipe.form.photoUrlPh')"
                                (input)="onPhotoInput($event)" />
                            <small class="text-surface-400">{{ t('communication.equipe.form.photoUrlHint') }}</small>
                            @if (photoPreview()) {
                                <div style="display:flex;align-items:center;gap:12px;margin-top:6px;
                                            padding:10px;border-radius:10px;
                                            background:var(--p-surface-50);border:1px solid var(--p-surface-200)">
                                    <img [src]="photoPreview()"
                                         [alt]="t('communication.equipe.form.photoPreview')"
                                         style="width:56px;height:56px;border-radius:50%;object-fit:cover;
                                                border:2px solid var(--p-surface-200);flex-shrink:0"
                                         (error)="photoPreview.set('')">
                                    <span class="text-sm" style="color:var(--p-surface-500)">
                                        {{ t('communication.equipe.form.photoPreview') }}
                                    </span>
                                </div>
                            }
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="font-semibold text-sm">
                                {{ t('communication.equipe.form.ordre') }}
                                <span style="color:var(--color-danger)">*</span>
                            </label>
                            <p-inputnumber formControlName="ordre" [min]="1" [showButtons]="true"></p-inputnumber>
                            @if (form.controls['ordre'].invalid && form.controls['ordre'].touched) {
                                <small style="color:var(--color-danger)">{{ t('communication.commun.requis') }}</small>
                            }
                        </div>
                    </div>

                    @if (saveError()) {
                        <p-message severity="error" [text]="saveError()!"></p-message>
                    }
                </form>
            </p-fluid>
            <ng-template #footer>
                <button pButton severity="secondary"
                    [label]="t('communication.commun.annuler')"
                    [disabled]="saving()"
                    (click)="closeDialog()">
                </button>
                <button pButton
                    [label]="editTarget() ? t('communication.commun.modifier') : t('communication.commun.creer')"
                    [loading]="saving()"
                    (click)="onSubmit()">
                </button>
            </ng-template>
        </p-dialog>

        <gescol-delete-confirm-dialog
            [(visible)]="deleteVisible"
            [itemLabel]="deleteLabel"
            [deleteFn]="deleteFn"
            (deleted)="onDeleted()">
        </gescol-delete-confirm-dialog>
    </ng-container>
    `
})
export class EquipePedagogique implements OnInit {
    private svc  = inject(VitrineService);
    private auth = inject(AuthService);
    private fb   = inject(FormBuilder);
    private t9n  = inject(TranslocoService);

    readonly items         = signal<MembreEquipePedagogiqueResponse[]>([]);
    readonly loading       = signal(false);
    readonly loadError     = signal(false);
    readonly dialogVisible = signal(false);
    readonly editTarget    = signal<MembreEquipePedagogiqueResponse | null>(null);
    readonly saving        = signal(false);
    readonly saveError     = signal<string | null>(null);
    readonly photoPreview  = signal<string>('');

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    readonly canWrite = computed(() => {
        const r = this.auth.role();
        return r === 'SUPER_ADMIN' || r === 'COMMUNICATION';
    });

    readonly form = this.fb.group({
        nom:      ['', Validators.required],
        fonction: ['', Validators.required],
        photoUrl: [''],
        ordre:    [1, [Validators.required, Validators.min(1)]]
    });

    ngOnInit(): void { this.loadItems(); }

    private loadItems(): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.svc.getEquipePedagogique().subscribe({
            next: items => { this.items.set(items); this.loading.set(false); },
            error: ()  => { this.loadError.set(true); this.loading.set(false); }
        });
    }

    openCreate(): void {
        this.editTarget.set(null);
        this.form.reset({ nom: '', fonction: '', photoUrl: '', ordre: this.nextOrdre() });
        this.saveError.set(null);
        this.photoPreview.set('');
        this.dialogVisible.set(true);
    }

    openEdit(item: MembreEquipePedagogiqueResponse): void {
        this.editTarget.set(item);
        this.form.patchValue({ nom: item.nom, fonction: item.fonction, photoUrl: item.photoUrl ?? '', ordre: item.ordre });
        this.saveError.set(null);
        this.photoPreview.set(item.photoUrl ?? '');
        this.dialogVisible.set(true);
    }

    closeDialog(): void { if (!this.saving()) this.dialogVisible.set(false); }
    onDialogChange(v: boolean): void { if (!v && !this.saving()) this.dialogVisible.set(false); }

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) return;

        this.saving.set(true);
        this.saveError.set(null);
        const v = this.form.getRawValue();
        const req = {
            nom:      v.nom!.trim(),
            fonction: v.fonction!.trim(),
            photoUrl: v.photoUrl?.trim() || undefined,
            ordre:    v.ordre ?? 1
        };

        const target = this.editTarget();
        const req$ = target
            ? this.svc.modifierMembreEquipe(target.id, req)
            : this.svc.creerMembreEquipe(req);

        req$.subscribe({
            next: () => { this.saving.set(false); this.dialogVisible.set(false); this.loadItems(); },
            error: err => {
                this.saving.set(false);
                const msg = err?.error?.message ?? null;
                this.saveError.set(typeof msg === 'string' ? msg : this.t9n.translate('app.communication.commun.erreurEnregistrement'));
            }
        });
    }

    onDelete(item: MembreEquipePedagogiqueResponse): void {
        this.deleteLabel = item.nom;
        this.deleteFn = () => this.svc.supprimerMembreEquipe(item.id);
        this.deleteVisible = true;
    }

    onDeleted(): void { this.deleteVisible = false; this.loadItems(); }

    onPhotoInput(event: Event): void {
        const val = (event.target as HTMLInputElement).value.trim();
        this.photoPreview.set(val.startsWith('http') ? val : '');
    }

    private nextOrdre(): number {
        const items = this.items();
        return items.length === 0 ? 1 : Math.max(...items.map(i => i.ordre)) + 1;
    }
}
