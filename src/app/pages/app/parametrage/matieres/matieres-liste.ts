import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';
import { ParametrageService, MatiereResponse } from '@/app/core/services/parametrage.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PageResponse } from '@/app/core/services/eleve.service';

@Component({
    selector: 'app-matieres-liste',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule, TranslocoDirective,
        ButtonModule, DialogModule, SelectButtonModule, InputTextModule, MessageModule, FluidModule,
        GescolTableComponent, DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">{{ t('parametrage.matieres.titre') }}</h2>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus" [label]="t('parametrage.matieres.nouveau')"
                        class="p-button-success" (click)="openCreate()"></button>
                }
            </div>
            <gescol-table #tableRef
                [columns]="columns(t)"
                [data]="data()"
                [showView]="false"
                [showEdit]="canWrite()"
                [showDelete]="canWrite()"
                (load)="onLoad($event)"
                (edit)="openEdit($event)"
                (delete)="onDeleteRequest($event)"
            ></gescol-table>
        </div>

        <p-dialog
            [(visible)]="dialogVisible"
            [header]="selectedItem() ? t('parametrage.matieres.form.titreEdition') : t('parametrage.matieres.form.titreCreation')"
            [modal]="true" [style]="{width:'440px'}" [closable]="!saving()"
            (onHide)="closeDialog()"
        >
            <p-fluid>
                <form [formGroup]="form" class="flex flex-col gap-4 mt-1">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.matieres.form.libelle') }} <span style="color:var(--color-danger)">*</span></label>
                        <input pInputText formControlName="libelle" placeholder="ex. Mathématiques" />
                        @if (form.controls['libelle'].invalid && form.controls['libelle'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.matieres.form.sousSysteme') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-selectbutton formControlName="sousSysteme" [options]="sousSystemeOptions()" optionLabel="label" optionValue="value"></p-selectbutton>
                        @if (form.controls['sousSysteme'].invalid && form.controls['sousSysteme'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    @if (saveError()) {
                        <p-message severity="error" [text]="saveError()!"></p-message>
                    }
                </form>
            </p-fluid>
            <ng-template #footer>
                <button pButton severity="secondary" [label]="t('parametrage.commun.annuler')" [disabled]="saving()" (click)="closeDialog()"></button>
                <button pButton [label]="selectedItem() ? t('parametrage.commun.modifier') : t('parametrage.commun.creer')" [loading]="saving()" (click)="onSubmit()"></button>
            </ng-template>
        </p-dialog>

        <gescol-delete-confirm-dialog
            [(visible)]="deleteVisible" [itemLabel]="deleteLabel" [deleteFn]="deleteFn" (deleted)="onDeleted()"
        ></gescol-delete-confirm-dialog>
    </ng-container>
    `
})
export class MatieresListe {
    private svc         = inject(ParametrageService);
    private authService = inject(AuthService);
    private fb          = inject(FormBuilder);
    private transloco   = inject(TranslocoService);
    private activeLang  = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });

    @ViewChild('tableRef') tableRef!: GescolTableComponent;

    readonly data          = signal<PageResponse<MatiereResponse> | 'error' | undefined>(undefined);
    readonly dialogVisible = signal(false);
    readonly selectedItem  = signal<MatiereResponse | null>(null);
    readonly saving        = signal(false);
    readonly saveError     = signal<string | null>(null);

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    canWrite = () => this.authService.role() === 'SUPER_ADMIN';

    readonly form = this.fb.group({
        libelle:     ['', Validators.required],
        sousSysteme: [null as 'FRANCOPHONE' | 'ANGLOPHONE' | null, Validators.required]
    });

    readonly sousSystemeOptions = computed(() => {
        this.activeLang();
        return [
            { value: 'FRANCOPHONE', label: this.transloco.translate('app.parametrage.sousSysteme.FRANCOPHONE') },
            { value: 'ANGLOPHONE',  label: this.transloco.translate('app.parametrage.sousSysteme.ANGLOPHONE') }
        ];
    });

    columns(t: (k: string) => string): ColDef[] {
        return [
            { field: 'libelle',    header: t('parametrage.matieres.cols.libelle'),    sortable: true },
            { field: 'sousSysteme',header: t('parametrage.matieres.cols.sousSysteme') }
        ];
    }

    onLoad(event: GescolLoadEvent): void {
        this.data.set(undefined);
        this.svc.getMatieres(event.page, event.size, event.sort).subscribe({
            next:  res => this.data.set(res),
            error: ()  => this.data.set('error')
        });
    }

    openCreate(): void {
        this.selectedItem.set(null);
        this.form.reset({ libelle: '', sousSysteme: null });
        this.saveError.set(null);
        this.dialogVisible.set(true);
    }

    openEdit(row: MatiereResponse): void {
        this.selectedItem.set(row);
        this.form.patchValue({ libelle: row.libelle, sousSysteme: row.sousSysteme });
        this.saveError.set(null);
        this.dialogVisible.set(true);
    }

    closeDialog(): void { if (!this.saving()) this.dialogVisible.set(false); }

    onSubmit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) return;
        this.saving.set(true);
        this.saveError.set(null);
        const v = this.form.getRawValue();
        const req = { libelle: v.libelle!.trim(), sousSysteme: v.sousSysteme! };
        const item = this.selectedItem();
        const req$ = item ? this.svc.modifierMatiere(item.id, req) : this.svc.creerMatiere(req);
        req$.subscribe({
            next: () => { this.saving.set(false); this.dialogVisible.set(false); this.tableRef?.resetPage(); },
            error: (err) => {
                this.saving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.saveError.set(typeof msg === 'string' ? msg : this.transloco.translate('app.parametrage.erreurEnregistrement'));
            }
        });
    }

    onDeleteRequest(row: MatiereResponse): void {
        this.deleteLabel = row.libelle;
        this.deleteFn = () => this.svc.supprimerMatiere(row.id);
        this.deleteVisible = true;
    }

    onDeleted(): void { this.deleteVisible = false; this.tableRef?.resetPage(); }
}
