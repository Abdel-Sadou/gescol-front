import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';
import { ParametrageService, CoefficientResponse } from '@/app/core/services/parametrage.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PageResponse } from '@/app/core/services/eleve.service';

interface SelectOption { value: string; label: string; }

@Component({
    selector: 'app-coefficients-liste',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, ReactiveFormsModule, TranslocoDirective,
        ButtonModule, DialogModule, SelectModule, InputNumberModule,
        MessageModule, FluidModule,
        GescolTableComponent, DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">
                    <i class="pi pi-percentage mr-2" style="color:var(--color-primary)"></i>
                    {{ t('parametrage.coefficients.titre') }}
                </h2>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus" [label]="t('parametrage.coefficients.nouveau')"
                        class="p-button-success" (click)="openCreate()"></button>
                }
            </div>
            @if (successMsg()) {
                <p-message severity="success" [text]="successMsg()!" class="mb-3 block"></p-message>
            }
            <!-- Filtres rapides -->
            <div class="flex gap-3 mb-3 flex-wrap">
                <div style="min-width:200px;flex:1">
                    <p-select
                        [ngModel]="filterClasseId()"
                        (ngModelChange)="onClasseFilterChange($event)"
                        [options]="classeOptions()"
                        optionLabel="label" optionValue="value"
                        [showClear]="true"
                        [placeholder]="t('parametrage.coefficients.filtreClassePh')">
                    </p-select>
                </div>
                <div style="min-width:200px;flex:1">
                    <p-select
                        [ngModel]="filterMatiereId()"
                        (ngModelChange)="onMatiereFilterChange($event)"
                        [options]="matiereOptions()"
                        optionLabel="label" optionValue="value"
                        [showClear]="true"
                        [placeholder]="t('parametrage.coefficients.filtreMatierePh')">
                    </p-select>
                </div>
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
            [header]="selectedItem() ? t('parametrage.coefficients.form.titreEdition') : t('parametrage.coefficients.form.titreCreation')"
            [modal]="true" [style]="{width:'480px'}" [closable]="!saving()"
            (onHide)="closeDialog()"
        >
            <p-fluid>
                <form [formGroup]="form" class="flex flex-col gap-4 mt-1">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.coefficients.form.matiereId') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-select formControlName="matiereId"
                            [options]="matiereOptions()"
                            optionLabel="label" optionValue="value"
                            [filter]="true"
                            appendTo="body"
                            [placeholder]="t('parametrage.coefficients.form.matierePlaceholder')">
                        </p-select>
                        @if (form.controls['matiereId'].invalid && form.controls['matiereId'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.coefficients.form.classeId') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-select formControlName="classeId"
                            [options]="classeOptions()"
                            optionLabel="label" optionValue="value"
                            [filter]="true"
                            appendTo="body"
                            [placeholder]="t('parametrage.coefficients.form.classePlaceholder')">
                        </p-select>
                        @if (form.controls['classeId'].invalid && form.controls['classeId'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.coefficients.form.valeur') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-inputnumber formControlName="valeur" [min]="0.01" [minFractionDigits]="0" [maxFractionDigits]="2" [showButtons]="true" [step]="0.5" placeholder="ex. 3"></p-inputnumber>
                        @if (form.controls['valeur'].invalid && form.controls['valeur'].touched) {
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
export class CoefficientsListe implements OnInit {
    private svc         = inject(ParametrageService);
    private authService = inject(AuthService);
    private fb          = inject(FormBuilder);
    private transloco   = inject(TranslocoService);

    @ViewChild('tableRef') tableRef!: GescolTableComponent;

    readonly data          = signal<PageResponse<CoefficientResponse> | 'error' | undefined>(undefined);
    readonly dialogVisible = signal(false);
    readonly selectedItem  = signal<CoefficientResponse | null>(null);
    readonly saving        = signal(false);
    readonly saveError      = signal<string | null>(null);
    readonly successMsg     = signal<string | null>(null);
    readonly classeOptions  = signal<SelectOption[]>([]);
    readonly matiereOptions = signal<SelectOption[]>([]);
    readonly filterClasseId  = signal<string | null>(null);
    readonly filterMatiereId = signal<string | null>(null);

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    readonly canWrite = computed(() => this.authService.role() === 'SUPER_ADMIN');

    readonly form = this.fb.group({
        matiereId:[null as string | null, Validators.required],
        classeId: [null as string | null, Validators.required],
        valeur:   [null as number | null, [Validators.required, Validators.min(0.01)]]
    });

    columns(t: (k: string) => string): ColDef[] {
        return [
            { field: 'matiereLibelle', header: t('parametrage.coefficients.cols.matiere') },
            { field: 'classeLibelle',  header: t('parametrage.coefficients.cols.classe') },
            { field: 'valeur',         header: t('parametrage.coefficients.cols.valeur'), width: '100px', sortable: true }
        ];
    }

    ngOnInit(): void {
        this.svc.getClasses(0, 200, 'libelle,asc').subscribe({
            next: res => this.classeOptions.set(res.content.map(c => ({ value: c.id, label: c.libelle }))),
            error: () => {}
        });
        this.svc.getMatieres(0, 200, 'libelle,asc').subscribe({
            next: res => this.matiereOptions.set(res.content.map(m => ({ value: m.id, label: m.libelle }))),
            error: () => {}
        });
    }

    onLoad(event: GescolLoadEvent): void {
        this.data.set(undefined);
        this.svc.getCoefficients(0, 500, event.sort).subscribe({
            next: res => {
                const cid = this.filterClasseId();
                const mid = this.filterMatiereId();
                let items = res.content;
                if (cid) items = items.filter(i => i.classeId === cid);
                if (mid) items = items.filter(i => i.matiereId === mid);
                this.data.set({ content: items, page: 0, size: items.length, totalElements: items.length, totalPages: items.length > 0 ? 1 : 0 });
            },
            error: () => this.data.set('error')
        });
    }

    onClasseFilterChange(value: string | null): void {
        this.filterClasseId.set(value);
        this.tableRef?.resetPage();
    }

    onMatiereFilterChange(value: string | null): void {
        this.filterMatiereId.set(value);
        this.tableRef?.resetPage();
    }

    openCreate(): void {
        this.selectedItem.set(null);
        this.form.reset({ matiereId: null, classeId: null, valeur: null });
        this.saveError.set(null);
        this.dialogVisible.set(true);
    }

    openEdit(row: CoefficientResponse): void {
        this.selectedItem.set(row);
        this.form.patchValue({ matiereId: row.matiereId, classeId: row.classeId, valeur: row.valeur });
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
        const req = { matiereId: v.matiereId!, classeId: v.classeId!, valeur: v.valeur! };
        const item = this.selectedItem();
        const req$ = item ? this.svc.modifierCoefficient(item.id, req) : this.svc.creerCoefficient(req);
        req$.subscribe({
            next: () => {
                this.saving.set(false);
                this.dialogVisible.set(false);
                this.tableRef?.resetPage();
                this.successMsg.set(this.transloco.translate('app.parametrage.commun.successEnregistrement'));
                setTimeout(() => this.successMsg.set(null), 4000);
            },
            error: (err) => {
                this.saving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.saveError.set(typeof msg === 'string' ? msg : this.transloco.translate('app.parametrage.erreurEnregistrement'));
            }
        });
    }

    onDeleteRequest(row: CoefficientResponse): void {
        this.deleteLabel = `${row.matiereLibelle} / ${row.classeLibelle}`;
        this.deleteFn = () => this.svc.supprimerCoefficient(row.id);
        this.deleteVisible = true;
    }

    onDeleted(): void { this.deleteVisible = false; this.tableRef?.resetPage(); }
}
