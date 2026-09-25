import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';
import { AuthService } from '@/app/core/services/auth.service';
import {
    DisciplineService, RegleDisciplineResponse, TypeSanction, ALL_TYPES_SANCTION
} from '@/app/core/services/discipline.service';
import { PageResponse } from '@/app/core/services/eleve.service';

type ReglesRow = RegleDisciplineResponse & { declencheurLabel: string; resultanteLabel: string; regle: string };

@Component({
    selector: 'app-regles-escalade',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule, TranslocoDirective,
        ButtonModule, DialogModule, SelectModule, InputNumberModule, MessageModule, FluidModule,
        GescolTableComponent, DeleteConfirmDialogComponent
    ],
    styles: [`
        .re-page-header { display: flex; align-items: center; gap: 18px; margin-bottom: 28px; }
        .re-header-icon {
            width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
            background: #f5f3ff; border: 1px solid #ddd6fe;
            display: flex; align-items: center; justify-content: center;
        }
        .re-header-icon i { font-size: 24px; color: #7c3aed; }
        .re-page-title { font-size: 24px; font-weight: 800; margin: 0 0 3px; color: var(--color-text); }
        .re-page-sub { font-size: 14px; color: var(--color-text-muted); margin: 0; }

        .re-info-box {
            display: flex; align-items: flex-start; gap: 12px;
            background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px;
            padding: 14px 18px; margin-bottom: 20px; font-size: 13px; color: #4c1d95;
        }
        .re-info-box i { font-size: 18px; flex-shrink: 0; margin-top: 1px; color: #7c3aed; }

        .re-readonly-notice {
            display: flex; align-items: center; gap: 10px;
            background: var(--color-surface-alt); border: 1px solid var(--color-border);
            border-radius: 8px; padding: 10px 16px; margin-bottom: 16px;
            font-size: 13px; color: var(--color-text-muted);
        }
        .re-readonly-notice i { color: var(--color-text-muted); font-size: 16px; }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <!-- ── En-tête page ── -->
        <div class="re-page-header">
            <div class="re-header-icon"><i class="pi pi-sliders-h"></i></div>
            <div>
                <div class="re-page-title">{{ t('discipline.regles.titre') }}</div>
                <p class="re-page-sub">{{ t('discipline.regles.sousTitre') }}</p>
            </div>
        </div>

        <div class="card">
            <!-- ── Explication du mécanisme ── -->
            <div class="re-info-box">
                <i class="pi pi-info-circle"></i>
                <span>{{ t('discipline.regles.explication') }}</span>
            </div>

            @if (!canWrite()) {
                <div class="re-readonly-notice">
                    <i class="pi pi-lock"></i>
                    <span>{{ t('discipline.regles.lectureSeule') }}</span>
                </div>
            }

            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <div>
                    <h2 class="text-xl font-semibold m-0">{{ t('discipline.regles.listeTitre') }}</h2>
                </div>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus" [label]="t('discipline.regles.nouveau')"
                        class="p-button-success" (click)="openCreate()"></button>
                }
            </div>

            <gescol-table #tableRef
                [columns]="columns()"
                [data]="data()"
                [pageSize]="50"
                [showView]="false"
                [showEdit]="canWrite()"
                [showDelete]="canWrite()"
                (load)="onLoad($event)"
                (edit)="openEdit($event)"
                (delete)="onDeleteRequest($event)"
            ></gescol-table>
        </div>

        <!-- ── Dialog création / édition ── -->
        <p-dialog
            [(visible)]="dialogVisible"
            [header]="selectedItem() ? t('discipline.regles.form.titreEdition') : t('discipline.regles.form.titreCreation')"
            [modal]="true" [style]="{width:'460px'}" [closable]="!saving()"
            (onHide)="closeDialog()"
        >
            <p-fluid>
                <form [formGroup]="form" class="flex flex-col gap-4 mt-1">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">
                            {{ t('discipline.regles.form.declencheur') }} <span style="color:var(--color-danger)">*</span>
                        </label>
                        <p-select
                            formControlName="typeSanctionDeclencheur"
                            [options]="typeSanctionOptions()"
                            optionLabel="label" optionValue="value"
                            [placeholder]="t('discipline.regles.form.choisirType')">
                        </p-select>
                        @if (form.controls['typeSanctionDeclencheur'].invalid && form.controls['typeSanctionDeclencheur'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">
                            {{ t('discipline.regles.form.seuil') }} <span style="color:var(--color-danger)">*</span>
                        </label>
                        <p-inputnumber formControlName="seuilDeclenchement" [min]="1" [showButtons]="true"></p-inputnumber>
                        @if (form.controls['seuilDeclenchement'].invalid && form.controls['seuilDeclenchement'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">
                            {{ t('discipline.regles.form.resultante') }} <span style="color:var(--color-danger)">*</span>
                        </label>
                        <p-select
                            formControlName="sanctionResultante"
                            [options]="typeSanctionOptions()"
                            optionLabel="label" optionValue="value"
                            [placeholder]="t('discipline.regles.form.choisirType')">
                        </p-select>
                        @if (form.controls['sanctionResultante'].invalid && form.controls['sanctionResultante'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>

                    @if (saveError()) {
                        <p-message severity="error" [text]="saveError()!"></p-message>
                    }
                </form>
            </p-fluid>
            <ng-template #footer>
                <button pButton severity="secondary" [label]="t('parametrage.commun.annuler')"
                    [disabled]="saving()" (click)="closeDialog()"></button>
                <button pButton
                    [label]="selectedItem() ? t('parametrage.commun.modifier') : t('parametrage.commun.creer')"
                    [loading]="saving()" (click)="onSubmit()"></button>
            </ng-template>
        </p-dialog>

        <gescol-delete-confirm-dialog
            [visible]="deleteVisible()" (visibleChange)="deleteVisible.set($event)"
            [itemLabel]="deleteLabel"
            [deleteFn]="deleteFn"
            (deleted)="onDeleted()"
        ></gescol-delete-confirm-dialog>
    </ng-container>
    `
})
export class ReglesEscalade {
    private svc         = inject(DisciplineService);
    private authService = inject(AuthService);
    private fb          = inject(FormBuilder);
    private transloco   = inject(TranslocoService);
    private activeLang  = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });

    @ViewChild('tableRef') tableRef!: GescolTableComponent;

    readonly data          = signal<PageResponse<ReglesRow> | 'error' | undefined>(undefined);
    readonly dialogVisible = signal(false);
    readonly selectedItem  = signal<RegleDisciplineResponse | null>(null);
    readonly saving        = signal(false);
    readonly saveError     = signal<string | null>(null);

    readonly deleteVisible = signal(false);
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    readonly canWrite = computed(() => this.authService.role() === 'SUPER_ADMIN');

    readonly form = this.fb.group({
        typeSanctionDeclencheur: [null as TypeSanction | null, Validators.required],
        seuilDeclenchement:      [3, [Validators.required, Validators.min(1)]],
        sanctionResultante:      [null as TypeSanction | null, Validators.required]
    });

    readonly typeSanctionOptions = computed(() => {
        this.activeLang();
        return ALL_TYPES_SANCTION.map(v => ({
            value: v,
            label: this.transloco.translate(`app.discipline.sanctions.types.${v}`)
        }));
    });

    readonly columns = computed((): ColDef[] => {
        this.activeLang();
        return [
            { field: 'regle', header: this.transloco.translate('app.discipline.regles.cols.regle'), sortable: false }
        ];
    });

    onLoad(_event: GescolLoadEvent): void {
        this.data.set(undefined);
        this.svc.getRegles().subscribe({
            next: list => {
                const rows: ReglesRow[] = list.map(r => {
                    const d = this.transloco.translate(`app.discipline.sanctions.types.${r.typeSanctionDeclencheur}`);
                    const re = this.transloco.translate(`app.discipline.sanctions.types.${r.sanctionResultante}`);
                    return {
                        ...r,
                        declencheurLabel: d,
                        resultanteLabel:  re,
                        regle: `${d} × ${r.seuilDeclenchement} → ${re}`
                    };
                });
                this.data.set({
                    content: rows,
                    page: 0,
                    size: rows.length || 1,
                    totalElements: rows.length,
                    totalPages: 1
                });
            },
            error: () => this.data.set('error')
        });
    }

    openCreate(): void {
        this.selectedItem.set(null);
        this.form.reset({ typeSanctionDeclencheur: null, seuilDeclenchement: 3, sanctionResultante: null });
        this.saveError.set(null);
        this.dialogVisible.set(true);
    }

    openEdit(row: ReglesRow): void {
        this.selectedItem.set(row);
        this.form.patchValue({
            typeSanctionDeclencheur: row.typeSanctionDeclencheur,
            seuilDeclenchement:      row.seuilDeclenchement,
            sanctionResultante:      row.sanctionResultante
        });
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
        const req = {
            typeSanctionDeclencheur: v.typeSanctionDeclencheur!,
            seuilDeclenchement:      v.seuilDeclenchement!,
            sanctionResultante:      v.sanctionResultante!
        };
        const item = this.selectedItem();
        const req$ = item ? this.svc.modifierRegle(item.id, req) : this.svc.creerRegle(req);
        req$.subscribe({
            next: () => {
                this.saving.set(false);
                this.dialogVisible.set(false);
                this.tableRef?.resetPage();
            },
            error: err => {
                this.saving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.saveError.set(typeof msg === 'string' ? msg :
                    this.transloco.translate('app.discipline.regles.erreurEnregistrement'));
            }
        });
    }

    onDeleteRequest(row: ReglesRow): void {
        this.deleteLabel = `${row.declencheurLabel} × ${row.seuilDeclenchement} → ${row.resultanteLabel}`;
        this.deleteFn    = () => this.svc.supprimerRegle(row.id);
        this.deleteVisible.set(true);
    }

    onDeleted(): void { this.deleteVisible.set(false); this.tableRef?.resetPage(); }
}
