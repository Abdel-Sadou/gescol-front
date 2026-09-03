import { Component, ChangeDetectionStrategy, inject, signal, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';
import { ParametrageService, TauxScolariteResponse } from '@/app/core/services/parametrage.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PageResponse } from '@/app/core/services/eleve.service';
import { getAnneeScolaireCourante, getAnneeScolaireOptions, getAnneeScolaireOptionsAvec, AnneeScolaireOption } from '@/app/core/utils/annee-scolaire.utils';

interface SelectOption { value: string; label: string; }

@Component({
    selector: 'app-taux-scolarite-liste',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule, TranslocoDirective,
        ButtonModule, DialogModule, SelectModule, InputTextModule, InputNumberModule,
        MessageModule, FluidModule,
        GescolTableComponent, DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">{{ t('parametrage.tauxScolarite.titre') }}</h2>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus" [label]="t('parametrage.tauxScolarite.nouveau')"
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
            [header]="selectedItem() ? t('parametrage.tauxScolarite.form.titreEdition') : t('parametrage.tauxScolarite.form.titreCreation')"
            [modal]="true" [style]="{width:'460px'}" [closable]="!saving()"
            (onHide)="closeDialog()"
        >
            <p-fluid>
                <form [formGroup]="form" class="flex flex-col gap-4 mt-1">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.tauxScolarite.form.classeId') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-select formControlName="classeId"
                            [options]="classeOptions()"
                            optionLabel="label" optionValue="value"
                            [filter]="true"
                            appendTo="body"
                            [placeholder]="t('parametrage.tauxScolarite.form.classePlaceholder')">
                        </p-select>
                        @if (form.controls['classeId'].invalid && form.controls['classeId'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.tauxScolarite.form.montant') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-inputnumber formControlName="montant" [min]="0" [minFractionDigits]="0" [maxFractionDigits]="2" placeholder="ex. 75000"></p-inputnumber>
                        @if (form.controls['montant'].invalid && form.controls['montant'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.tauxScolarite.form.anneeScolaire') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-select formControlName="anneeScolaire"
                            [options]="anneeScolaireOptions()"
                            optionLabel="label" optionValue="value"
                            appendTo="body">
                        </p-select>
                        @if (form.controls['anneeScolaire'].invalid && form.controls['anneeScolaire'].touched) {
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
export class TauxScolariteListe implements OnInit {
    private svc         = inject(ParametrageService);
    private authService = inject(AuthService);
    private fb          = inject(FormBuilder);
    private transloco   = inject(TranslocoService);

    @ViewChild('tableRef') tableRef!: GescolTableComponent;

    readonly data          = signal<PageResponse<TauxScolariteResponse> | 'error' | undefined>(undefined);
    readonly dialogVisible = signal(false);
    readonly selectedItem  = signal<TauxScolariteResponse | null>(null);
    readonly saving        = signal(false);
    readonly saveError     = signal<string | null>(null);
    readonly classeOptions        = signal<SelectOption[]>([]);
    readonly anneeScolaireOptions = signal<AnneeScolaireOption[]>(getAnneeScolaireOptions());

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    // SCOLARITE_TAUX_MODIFIER est une permission manuelle non visible dans le JWT
    // On restreint à SUPER_ADMIN (garantie d'avoir cette permission) côté UX
    canWrite = () => this.authService.role() === 'SUPER_ADMIN';

    readonly form = this.fb.group({
        classeId:     [null as string | null, Validators.required],
        montant:      [null as number | null, [Validators.required, Validators.min(0)]],
        anneeScolaire:['', Validators.required]
    });

    columns(t: (k: string) => string): ColDef[] {
        return [
            { field: 'classeLibelle', header: t('parametrage.tauxScolarite.cols.classe') },
            { field: 'montant',       header: t('parametrage.tauxScolarite.cols.montant'),       width: '140px', sortable: true },
            { field: 'anneeScolaire', header: t('parametrage.tauxScolarite.cols.anneeScolaire'), width: '120px', sortable: true }
        ];
    }

    ngOnInit(): void {
        this.svc.getClasses(0, 200, 'libelle,asc').subscribe({
            next: res => this.classeOptions.set(res.content.map(c => ({ value: c.id, label: c.libelle }))),
            error: () => {}
        });
    }

    onLoad(event: GescolLoadEvent): void {
        this.data.set(undefined);
        this.svc.getTauxScolarite(event.page, event.size, event.sort).subscribe({
            next:  res => this.data.set(res),
            error: ()  => this.data.set('error')
        });
    }

    openCreate(): void {
        this.selectedItem.set(null);
        this.anneeScolaireOptions.set(getAnneeScolaireOptions());
        this.form.reset({ classeId: null, montant: null, anneeScolaire: getAnneeScolaireCourante() });
        this.saveError.set(null);
        this.dialogVisible.set(true);
    }

    openEdit(row: TauxScolariteResponse): void {
        this.selectedItem.set(row);
        this.anneeScolaireOptions.set(getAnneeScolaireOptionsAvec(row.anneeScolaire));
        this.form.patchValue({ classeId: row.classeId, montant: row.montant, anneeScolaire: row.anneeScolaire });
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
        const req = { classeId: v.classeId!, montant: v.montant!, anneeScolaire: v.anneeScolaire!.trim() };
        const item = this.selectedItem();
        const req$ = item ? this.svc.modifierTaux(item.id, req) : this.svc.creerTaux(req);
        req$.subscribe({
            next: () => { this.saving.set(false); this.dialogVisible.set(false); this.tableRef?.resetPage(); },
            error: (err) => {
                this.saving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.saveError.set(typeof msg === 'string' ? msg : this.transloco.translate('app.parametrage.erreurEnregistrement'));
            }
        });
    }

    onDeleteRequest(row: TauxScolariteResponse): void {
        this.deleteLabel = `${row.classeLibelle} — ${row.anneeScolaire}`;
        this.deleteFn = () => this.svc.supprimerTaux(row.id);
        this.deleteVisible = true;
    }

    onDeleted(): void { this.deleteVisible = false; this.tableRef?.resetPage(); }
}
