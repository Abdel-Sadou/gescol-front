import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { getAnneeScolaireCourante, getAnneeScolaireOptions, getAnneeScolaireOptionsAvec, AnneeScolaireOption } from '@/app/core/utils/annee-scolaire.utils';
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';
import { ParametrageService, TrimestreResponse, SequenceResponse } from '@/app/core/services/parametrage.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PageResponse } from '@/app/core/services/eleve.service';

@Component({
    selector: 'app-trimestres-liste',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, ReactiveFormsModule, TranslocoDirective,
        ButtonModule, DialogModule, InputTextModule, SelectModule, DatePickerModule,
        MessageModule, FluidModule, TableModule,
        GescolTableComponent, DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <!-- ── Trimestres ────────────────────────────────────────────────── -->
        <div class="card mb-4">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">{{ t('parametrage.trimestres.titre') }}</h2>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus" [label]="t('parametrage.trimestres.nouveau')"
                        class="p-button-success" (click)="openCreateTrimestre()"></button>
                }
            </div>
            <gescol-table #trimestreTable
                [columns]="trimestreColumns(t)"
                [data]="trimestreData()"
                [showView]="true"
                [showEdit]="canWrite()"
                [showDelete]="canWrite()"
                (load)="onLoadTrimestre($event)"
                (view)="onSelectTrimestre($event)"
                (edit)="openEditTrimestre($event)"
                (delete)="onDeleteTrimestre($event)"
            ></gescol-table>
        </div>

        <!-- ── Séquences du trimestre sélectionné ────────────────────────── -->
        @if (selectedTrimestre()) {
            <div class="card">
                <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <div>
                        <h2 class="text-xl font-semibold m-0">{{ t('parametrage.trimestres.sequences.titre') }}</h2>
                        <p class="text-surface-500 text-sm m-0 mt-1">{{ selectedTrimestre()!.libelle }} — {{ selectedTrimestre()!.anneeScolaire }}</p>
                    </div>
                    @if (canWrite()) {
                        <button pButton icon="pi pi-plus" [label]="t('parametrage.trimestres.sequences.nouveau')"
                            class="p-button-success p-button-sm" (click)="openCreateSequence()"></button>
                    }
                </div>
                @if (loadingSequences()) {
                    <div class="flex justify-center py-6">
                        <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:var(--p-primary-color)"></i>
                    </div>
                } @else {
                    <p-table [value]="filteredSequences()" styleClass="p-datatable-sm" [rowHover]="true">
                        <ng-template #header>
                            <tr>
                                <th>{{ t('parametrage.trimestres.sequences.cols.libelle') }}</th>
                                <th style="width:120px">{{ t('parametrage.trimestres.sequences.cols.dateDebut') }}</th>
                                <th style="width:120px">{{ t('parametrage.trimestres.sequences.cols.dateFin') }}</th>
                                @if (canWrite()) {
                                    <th style="width:90px;text-align:center">{{ t('table.actions') }}</th>
                                }
                            </tr>
                        </ng-template>
                        <ng-template #body let-row>
                            <tr>
                                <td>{{ row.libelle }}</td>
                                <td>{{ row.dateDebut | date:'dd/MM/yyyy' }}</td>
                                <td>{{ row.dateFin   | date:'dd/MM/yyyy' }}</td>
                                @if (canWrite()) {
                                    <td style="text-align:center">
                                        <div class="flex gap-1 justify-center">
                                            <button pButton icon="pi pi-pencil"
                                                class="p-button-text p-button-sm p-button-success"
                                                (click)="openEditSequence(row)"></button>
                                            <button pButton icon="pi pi-trash"
                                                class="p-button-text p-button-sm p-button-danger"
                                                (click)="onDeleteSequence(row)"></button>
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
        }

        <!-- Dialog trimestre -->
        <p-dialog
            [(visible)]="trimestreDialogVisible"
            [header]="selectedTrimestreForEdit() ? t('parametrage.trimestres.form.titreEdition') : t('parametrage.trimestres.form.titreCreation')"
            [modal]="true" [style]="{width:'480px'}" [closable]="!trimestreSaving()"
            (onHide)="closeTrimestreDialog()"
        >
            <p-fluid>
                <form [formGroup]="trimestreForm" class="flex flex-col gap-4 mt-1">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.trimestres.form.libelle') }} <span style="color:var(--color-danger)">*</span></label>
                        <input pInputText formControlName="libelle" placeholder="ex. Premier trimestre" />
                        @if (trimestreForm.controls['libelle'].invalid && trimestreForm.controls['libelle'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.trimestres.form.anneeScolaire') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-select formControlName="anneeScolaire"
                            [options]="anneeScolaireOptions()"
                            optionLabel="label" optionValue="value"
                            appendTo="body">
                        </p-select>
                        @if (trimestreForm.controls['anneeScolaire'].invalid && trimestreForm.controls['anneeScolaire'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="font-semibold text-sm">{{ t('parametrage.trimestres.form.dateDebut') }} <span style="color:var(--color-danger)">*</span></label>
                            <p-datepicker formControlName="dateDebut" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body"></p-datepicker>
                            @if (trimestreForm.controls['dateDebut'].invalid && trimestreForm.controls['dateDebut'].touched) {
                                <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                            }
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="font-semibold text-sm">{{ t('parametrage.trimestres.form.dateFin') }} <span style="color:var(--color-danger)">*</span></label>
                            <p-datepicker formControlName="dateFin" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body"></p-datepicker>
                            @if (trimestreForm.controls['dateFin'].invalid && trimestreForm.controls['dateFin'].touched) {
                                <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                            }
                        </div>
                    </div>
                    @if (trimestreSaveError()) {
                        <p-message severity="error" [text]="trimestreSaveError()!"></p-message>
                    }
                </form>
            </p-fluid>
            <ng-template #footer>
                <button pButton severity="secondary" [label]="t('parametrage.commun.annuler')" [disabled]="trimestreSaving()" (click)="closeTrimestreDialog()"></button>
                <button pButton [label]="selectedTrimestreForEdit() ? t('parametrage.commun.modifier') : t('parametrage.commun.creer')" [loading]="trimestreSaving()" (click)="onSubmitTrimestre()"></button>
            </ng-template>
        </p-dialog>

        <!-- Dialog séquence -->
        <p-dialog
            [(visible)]="sequenceDialogVisible"
            [header]="selectedSequenceForEdit() ? t('parametrage.trimestres.sequences.form.titreEdition') : t('parametrage.trimestres.sequences.form.titreCreation')"
            [modal]="true" [style]="{width:'480px'}" [closable]="!sequenceSaving()"
            (onHide)="closeSequenceDialog()"
        >
            <p-fluid>
                <form [formGroup]="sequenceForm" class="flex flex-col gap-4 mt-1">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.trimestres.sequences.form.libelle') }} <span style="color:var(--color-danger)">*</span></label>
                        <input pInputText formControlName="libelle" placeholder="ex. Séquence 1" />
                        @if (sequenceForm.controls['libelle'].invalid && sequenceForm.controls['libelle'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="font-semibold text-sm">{{ t('parametrage.trimestres.sequences.form.dateDebut') }} <span style="color:var(--color-danger)">*</span></label>
                            <p-datepicker formControlName="dateDebut" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body"></p-datepicker>
                            @if (sequenceForm.controls['dateDebut'].invalid && sequenceForm.controls['dateDebut'].touched) {
                                <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                            }
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="font-semibold text-sm">{{ t('parametrage.trimestres.sequences.form.dateFin') }} <span style="color:var(--color-danger)">*</span></label>
                            <p-datepicker formControlName="dateFin" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body"></p-datepicker>
                            @if (sequenceForm.controls['dateFin'].invalid && sequenceForm.controls['dateFin'].touched) {
                                <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                            }
                        </div>
                    </div>
                    @if (sequenceSaveError()) {
                        <p-message severity="error" [text]="sequenceSaveError()!"></p-message>
                    }
                </form>
            </p-fluid>
            <ng-template #footer>
                <button pButton severity="secondary" [label]="t('parametrage.commun.annuler')" [disabled]="sequenceSaving()" (click)="closeSequenceDialog()"></button>
                <button pButton [label]="selectedSequenceForEdit() ? t('parametrage.commun.modifier') : t('parametrage.commun.creer')" [loading]="sequenceSaving()" (click)="onSubmitSequence()"></button>
            </ng-template>
        </p-dialog>

        <!-- Dialogs de suppression -->
        <gescol-delete-confirm-dialog
            [(visible)]="deleteVisible" [itemLabel]="deleteLabel" [deleteFn]="deleteFn" (deleted)="onDeleted()"
        ></gescol-delete-confirm-dialog>
    </ng-container>
    `
})
export class TrimestresListe implements OnInit {
    private svc         = inject(ParametrageService);
    private authService = inject(AuthService);
    private fb          = inject(FormBuilder);
    private transloco   = inject(TranslocoService);

    @ViewChild('trimestreTable') trimestreTable!: GescolTableComponent;

    readonly anneeScolaireOptions = signal<AnneeScolaireOption[]>(getAnneeScolaireOptions());

    // Trimestres
    readonly trimestreData            = signal<PageResponse<TrimestreResponse> | 'error' | undefined>(undefined);
    readonly trimestreDialogVisible   = signal(false);
    readonly selectedTrimestreForEdit = signal<TrimestreResponse | null>(null);
    readonly trimestreSaving          = signal(false);
    readonly trimestreSaveError       = signal<string | null>(null);

    // Séquences
    readonly selectedTrimestre  = signal<TrimestreResponse | null>(null);
    readonly allSequences       = signal<SequenceResponse[]>([]);
    readonly loadingSequences   = signal(false);

    readonly filteredSequences = computed(() =>
        this.allSequences().filter(s => s.trimestreId === this.selectedTrimestre()?.id)
    );

    readonly sequenceDialogVisible   = signal(false);
    readonly selectedSequenceForEdit = signal<SequenceResponse | null>(null);
    readonly sequenceSaving          = signal(false);
    readonly sequenceSaveError       = signal<string | null>(null);

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    canWrite = () => this.authService.role() === 'SUPER_ADMIN';

    readonly trimestreForm = this.fb.group({
        libelle:      ['', Validators.required],
        anneeScolaire:['', Validators.required],
        dateDebut:    [null as Date | null, Validators.required],
        dateFin:      [null as Date | null, Validators.required]
    });

    readonly sequenceForm = this.fb.group({
        libelle:  ['', Validators.required],
        dateDebut:[null as Date | null, Validators.required],
        dateFin:  [null as Date | null, Validators.required]
    });

    trimestreColumns(t: (k: string) => string): ColDef[] {
        return [
            { field: 'libelle',       header: t('parametrage.trimestres.cols.libelle'),       sortable: false },
            { field: 'anneeScolaire', header: t('parametrage.trimestres.cols.anneeScolaire'),  width: '120px' },
            { field: 'dateDebut',     header: t('parametrage.trimestres.cols.dateDebut'),      date: true, width: '110px', sortable: true },
            { field: 'dateFin',       header: t('parametrage.trimestres.cols.dateFin'),        date: true, width: '110px' }
        ];
    }

    ngOnInit(): void { this.loadAllSequences(); }

    private loadAllSequences(): void {
        this.loadingSequences.set(true);
        this.svc.getSequences(0, 200, 'dateDebut,asc').subscribe({
            next: res => { this.allSequences.set(res.content); this.loadingSequences.set(false); },
            error: () => this.loadingSequences.set(false)
        });
    }

    onLoadTrimestre(event: GescolLoadEvent): void {
        this.trimestreData.set(undefined);
        this.svc.getTrimestres(event.page, event.size, event.sort).subscribe({
            next:  res => this.trimestreData.set(res),
            error: ()  => this.trimestreData.set('error')
        });
    }

    onSelectTrimestre(row: TrimestreResponse): void {
        this.selectedTrimestre.set(row);
    }

    // Trimestre CRUD
    openCreateTrimestre(): void {
        this.selectedTrimestreForEdit.set(null);
        this.anneeScolaireOptions.set(getAnneeScolaireOptions());
        this.trimestreForm.reset({ libelle: '', anneeScolaire: getAnneeScolaireCourante(), dateDebut: null, dateFin: null });
        this.trimestreSaveError.set(null);
        this.trimestreDialogVisible.set(true);
    }

    openEditTrimestre(row: TrimestreResponse): void {
        this.selectedTrimestreForEdit.set(row);
        this.anneeScolaireOptions.set(getAnneeScolaireOptionsAvec(row.anneeScolaire));
        this.trimestreForm.patchValue({
            libelle: row.libelle, anneeScolaire: row.anneeScolaire,
            dateDebut: row.dateDebut ? new Date(row.dateDebut) : null,
            dateFin:   row.dateFin   ? new Date(row.dateFin)   : null
        });
        this.trimestreSaveError.set(null);
        this.trimestreDialogVisible.set(true);
    }

    closeTrimestreDialog(): void { if (!this.trimestreSaving()) this.trimestreDialogVisible.set(false); }

    onSubmitTrimestre(): void {
        this.trimestreForm.markAllAsTouched();
        if (this.trimestreForm.invalid) return;
        this.trimestreSaving.set(true);
        this.trimestreSaveError.set(null);
        const v = this.trimestreForm.getRawValue();
        const req = {
            libelle: v.libelle!.trim(), anneeScolaire: v.anneeScolaire!.trim(),
            dateDebut: this.formatDate(v.dateDebut!), dateFin: this.formatDate(v.dateFin!)
        };
        const item = this.selectedTrimestreForEdit();
        const req$ = item ? this.svc.modifierTrimestre(item.id, req) : this.svc.creerTrimestre(req);
        req$.subscribe({
            next: () => { this.trimestreSaving.set(false); this.trimestreDialogVisible.set(false); this.trimestreTable?.resetPage(); },
            error: (err) => {
                this.trimestreSaving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.trimestreSaveError.set(typeof msg === 'string' ? msg : this.transloco.translate('app.parametrage.erreurEnregistrement'));
            }
        });
    }

    onDeleteTrimestre(row: TrimestreResponse): void {
        this.deleteLabel = row.libelle;
        this.deleteFn = () => this.svc.supprimerTrimestre(row.id);
        this.deleteVisible = true;
    }

    // Séquence CRUD
    openCreateSequence(): void {
        this.selectedSequenceForEdit.set(null);
        this.sequenceForm.reset();
        this.sequenceSaveError.set(null);
        this.sequenceDialogVisible.set(true);
    }

    openEditSequence(row: SequenceResponse): void {
        this.selectedSequenceForEdit.set(row);
        this.sequenceForm.patchValue({
            libelle:  row.libelle,
            dateDebut: row.dateDebut ? new Date(row.dateDebut) : null,
            dateFin:   row.dateFin   ? new Date(row.dateFin)   : null
        });
        this.sequenceSaveError.set(null);
        this.sequenceDialogVisible.set(true);
    }

    closeSequenceDialog(): void { if (!this.sequenceSaving()) this.sequenceDialogVisible.set(false); }

    onSubmitSequence(): void {
        this.sequenceForm.markAllAsTouched();
        if (this.sequenceForm.invalid) return;
        const trimestre = this.selectedTrimestre();
        if (!trimestre) return;
        this.sequenceSaving.set(true);
        this.sequenceSaveError.set(null);
        const v = this.sequenceForm.getRawValue();
        const req = {
            libelle: v.libelle!.trim(), trimestreId: trimestre.id,
            dateDebut: this.formatDate(v.dateDebut!), dateFin: this.formatDate(v.dateFin!)
        };
        const item = this.selectedSequenceForEdit();
        const req$ = item ? this.svc.modifierSequence(item.id, req) : this.svc.creerSequence(req);
        req$.subscribe({
            next: () => { this.sequenceSaving.set(false); this.sequenceDialogVisible.set(false); this.loadAllSequences(); },
            error: (err) => {
                this.sequenceSaving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.sequenceSaveError.set(typeof msg === 'string' ? msg : this.transloco.translate('app.parametrage.erreurEnregistrement'));
            }
        });
    }

    onDeleteSequence(row: SequenceResponse): void {
        this.deleteLabel = row.libelle;
        this.deleteFn = () => this.svc.supprimerSequence(row.id);
        this.deleteVisible = true;
    }

    onDeleted(): void { this.deleteVisible = false; this.trimestreTable?.resetPage(); this.loadAllSequences(); }

    private formatDate(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const j = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${j}`;
    }
}
