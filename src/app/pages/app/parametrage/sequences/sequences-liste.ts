import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { TableModule } from 'primeng/table';
import { ParametrageService, TrimestreResponse, SequenceResponse } from '@/app/core/services/parametrage.service';
import { AuthService } from '@/app/core/services/auth.service';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';

@Component({
    selector: 'app-sequences-liste',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, ReactiveFormsModule, FormsModule, TranslocoDirective,
        ButtonModule, DialogModule, InputTextModule, SelectModule, DatePickerModule,
        MessageModule, FluidModule, TableModule,
        DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <!-- En-tête -->
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">
                    <i class="pi pi-list-check mr-2" style="color:var(--color-primary)"></i>
                    {{ t('parametrage.sequences.titre') }}
                </h2>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus" [label]="t('parametrage.sequences.nouveau')"
                        class="p-button-success" (click)="openCreate()"></button>
                }
            </div>

            <!-- Filtre trimestre -->
            <div class="mb-4" style="max-width:320px">
                <p-select
                    [ngModel]="filterTrimestreId()"
                    (ngModelChange)="filterTrimestreId.set($event)"
                    [options]="trimestreFilterOptions()"
                    optionLabel="label" optionValue="value"
                    [placeholder]="t('parametrage.sequences.filtreTrimestre')"
                    [showClear]="true"
                    style="width:100%">
                </p-select>
            </div>

            @if (successMsg()) {
                <p-message severity="success" [text]="successMsg()!" class="mb-3 block"></p-message>
            }

            @if (loading()) {
                <div class="flex justify-center py-8">
                    <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:var(--p-primary-color)"></i>
                </div>
            } @else {
                <p-table [value]="filteredSequences()" styleClass="p-datatable-sm" [rowHover]="true"
                    [paginator]="filteredSequences().length > 10" [rows]="10">
                    <ng-template #header>
                        <tr>
                            <th>{{ t('parametrage.sequences.cols.libelle') }}</th>
                            <th>{{ t('parametrage.sequences.cols.trimestre') }}</th>
                            <th style="width:120px">{{ t('parametrage.sequences.cols.anneeScolaire') }}</th>
                            <th style="width:110px">{{ t('parametrage.sequences.cols.dateDebut') }}</th>
                            <th style="width:110px">{{ t('parametrage.sequences.cols.dateFin') }}</th>
                            @if (canWrite()) {
                                <th style="width:90px;text-align:center">Actions</th>
                            }
                        </tr>
                    </ng-template>
                    <ng-template #body let-row>
                        <tr>
                            <td><strong>{{ row.libelle }}</strong></td>
                            <td>{{ row.trimestreLibelle }}</td>
                            <td>{{ trimestreAnnee(row.trimestreId) }}</td>
                            <td>{{ row.dateDebut | date:'dd/MM/yyyy' }}</td>
                            <td>{{ row.dateFin   | date:'dd/MM/yyyy' }}</td>
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
                            <td [attr.colspan]="canWrite() ? 6 : 5" class="text-center py-8 text-surface-400">
                                Aucune séquence trouvée.
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            }
        </div>

        <!-- Dialog création / édition -->
        <p-dialog
            [(visible)]="dialogVisible"
            [header]="editingItem() ? t('parametrage.sequences.form.titreEdition') : t('parametrage.sequences.form.titreCreation')"
            [modal]="true" [style]="{width:'480px'}" [closable]="!saving()"
            (onHide)="closeDialog()"
        >
            <p-fluid>
                <form [formGroup]="form" class="flex flex-col gap-4 mt-1">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.sequences.form.libelle') }} <span style="color:var(--color-danger)">*</span></label>
                        <input pInputText formControlName="libelle" placeholder="ex. Séquence 1" />
                        @if (form.controls['libelle'].invalid && form.controls['libelle'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.sequences.form.trimestreId') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-select formControlName="trimestreId"
                            [options]="trimestreFormOptions()"
                            optionLabel="label" optionValue="value"
                            [placeholder]="t('parametrage.sequences.form.trimestrePlaceholder')"
                            appendTo="body">
                        </p-select>
                        @if (form.controls['trimestreId'].invalid && form.controls['trimestreId'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="font-semibold text-sm">{{ t('parametrage.sequences.form.dateDebut') }} <span style="color:var(--color-danger)">*</span></label>
                            <p-datepicker formControlName="dateDebut" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body"></p-datepicker>
                            @if (form.controls['dateDebut'].invalid && form.controls['dateDebut'].touched) {
                                <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                            }
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="font-semibold text-sm">{{ t('parametrage.sequences.form.dateFin') }} <span style="color:var(--color-danger)">*</span></label>
                            <p-datepicker formControlName="dateFin" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body"></p-datepicker>
                            @if (form.controls['dateFin'].invalid && form.controls['dateFin'].touched) {
                                <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                            }
                        </div>
                    </div>
                    @if (saveError()) {
                        <p-message severity="error" [text]="saveError()!"></p-message>
                    }
                </form>
            </p-fluid>
            <ng-template #footer>
                <button pButton severity="secondary" [label]="t('parametrage.commun.annuler')" [disabled]="saving()" (click)="closeDialog()"></button>
                <button pButton [label]="editingItem() ? t('parametrage.commun.modifier') : t('parametrage.commun.creer')" [loading]="saving()" (click)="onSubmit()"></button>
            </ng-template>
        </p-dialog>

        <gescol-delete-confirm-dialog
            [(visible)]="deleteVisible" [itemLabel]="deleteLabel" [deleteFn]="deleteFn" (deleted)="onDeleted()"
        ></gescol-delete-confirm-dialog>
    </ng-container>
    `
})
export class SequencesListe implements OnInit {
    private svc        = inject(ParametrageService);
    private authService= inject(AuthService);
    private fb         = inject(FormBuilder);
    private transloco  = inject(TranslocoService);

    readonly allSequences  = signal<SequenceResponse[]>([]);
    readonly allTrimestres = signal<TrimestreResponse[]>([]);
    readonly loading       = signal(true);
    readonly filterTrimestreId = signal<string | null>(null);

    readonly dialogVisible = signal(false);
    readonly editingItem   = signal<SequenceResponse | null>(null);
    readonly saving        = signal(false);
    readonly saveError     = signal<string | null>(null);
    readonly successMsg    = signal<string | null>(null);

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    readonly canWrite = computed(() => this.authService.role() === 'SUPER_ADMIN');

    readonly filteredSequences = computed(() => {
        const tid = this.filterTrimestreId();
        return tid
            ? this.allSequences().filter(s => s.trimestreId === tid)
            : this.allSequences();
    });

    readonly trimestreFilterOptions = computed(() => [
        ...this.allTrimestres().map(t => ({ label: `${t.libelle} — ${t.anneeScolaire}`, value: t.id }))
    ]);

    readonly trimestreFormOptions = computed(() =>
        this.allTrimestres().map(t => ({ label: `${t.libelle} — ${t.anneeScolaire}`, value: t.id }))
    );

    readonly form = this.fb.group({
        libelle:     ['', Validators.required],
        trimestreId: ['', Validators.required],
        dateDebut:   [null as Date | null, Validators.required],
        dateFin:     [null as Date | null, Validators.required]
    });

    ngOnInit(): void { this.loadAll(); }

    private loadAll(): void {
        this.loading.set(true);
        let done = 0;
        const check = () => { if (++done === 2) this.loading.set(false); };
        this.svc.getSequences(0, 200, 'dateDebut,asc').subscribe({
            next: res => { this.allSequences.set(res.content); check(); },
            error: () => check()
        });
        this.svc.getTrimestres(0, 100, 'dateDebut,asc').subscribe({
            next: res => { this.allTrimestres.set(res.content); check(); },
            error: () => check()
        });
    }

    trimestreAnnee(trimestreId: string): string {
        return this.allTrimestres().find(t => t.id === trimestreId)?.anneeScolaire ?? '—';
    }

    openCreate(): void {
        this.editingItem.set(null);
        this.form.reset();
        this.saveError.set(null);
        this.dialogVisible.set(true);
    }

    openEdit(row: SequenceResponse): void {
        this.editingItem.set(row);
        this.form.patchValue({
            libelle: row.libelle, trimestreId: row.trimestreId,
            dateDebut: row.dateDebut ? new Date(row.dateDebut) : null,
            dateFin:   row.dateFin   ? new Date(row.dateFin)   : null
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
            libelle: v.libelle!.trim(), trimestreId: v.trimestreId!,
            dateDebut: this.fmt(v.dateDebut!), dateFin: this.fmt(v.dateFin!)
        };
        const item = this.editingItem();
        const req$ = item ? this.svc.modifierSequence(item.id, req) : this.svc.creerSequence(req);
        req$.subscribe({
            next: () => {
                this.saving.set(false);
                this.dialogVisible.set(false);
                this.loadAll();
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

    onDelete(row: SequenceResponse): void {
        this.deleteLabel = row.libelle;
        this.deleteFn = () => this.svc.supprimerSequence(row.id);
        this.deleteVisible = true;
    }

    onDeleted(): void { this.deleteVisible = false; this.loadAll(); }

    private fmt(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const j = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${j}`;
    }
}
