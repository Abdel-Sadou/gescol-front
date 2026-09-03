import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { TooltipModule } from 'primeng/tooltip';
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';
import { ParametrageService, ClasseResponse, NiveauResponse } from '@/app/core/services/parametrage.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PageResponse } from '@/app/core/services/eleve.service';
import { getAnneeScolaireCourante, getAnneeScolaireOptions, getAnneeScolaireOptionsAvec, AnneeScolaireOption } from '@/app/core/utils/annee-scolaire.utils';

interface SelectOption { value: string; label: string; }

@Component({
    selector: 'app-classes-liste',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule, TranslocoDirective,
        ButtonModule, DialogModule, SelectModule, SelectButtonModule, InputTextModule,
        MessageModule, FluidModule, TooltipModule,
        GescolTableComponent, DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">{{ t('parametrage.classes.titre') }}</h2>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus" [label]="t('parametrage.classes.nouveau')"
                        class="p-button-success" (click)="openCreate()"></button>
                }
            </div>
            <!-- showView repurposé pour "Désigner professeur principal" côté SUPER_ADMIN/SECRETARIAT -->
            <gescol-table #tableRef
                [columns]="columns(t)"
                [data]="data()"
                [showView]="canWrite()"
                [showEdit]="canWrite()"
                [showDelete]="canWrite()"
                (load)="onLoad($event)"
                (view)="openPpDialog($event)"
                (edit)="openEdit($event)"
                (delete)="onDeleteRequest($event)"
            ></gescol-table>
        </div>

        <!-- Dialog création / édition classe -->
        <p-dialog
            [(visible)]="dialogVisible"
            [header]="selectedItem() ? t('parametrage.classes.form.titreEdition') : t('parametrage.classes.form.titreCreation')"
            [modal]="true" [style]="{width:'480px'}" [closable]="!saving()"
            (onHide)="closeDialog()"
        >
            <p-fluid>
                <form [formGroup]="form" class="flex flex-col gap-4 mt-1">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.classes.form.libelle') }} <span style="color:var(--color-danger)">*</span></label>
                        <input pInputText formControlName="libelle" placeholder="ex. 3ème A" />
                        @if (form.controls['libelle'].invalid && form.controls['libelle'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.classes.form.sousSysteme') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-selectbutton formControlName="sousSysteme" [options]="sousSystemeOptions()" optionLabel="label" optionValue="value"></p-selectbutton>
                        @if (form.controls['sousSysteme'].invalid && form.controls['sousSysteme'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.classes.form.anneeScolaire') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-select formControlName="anneeScolaire"
                            [options]="anneeScolaireOptions()"
                            optionLabel="label" optionValue="value"
                            appendTo="body">
                        </p-select>
                        @if (form.controls['anneeScolaire'].invalid && form.controls['anneeScolaire'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.classes.form.niveauId') }}</label>
                        <p-select formControlName="niveauId"
                            [options]="niveauOptions()"
                            optionLabel="label" optionValue="value"
                            [showClear]="true"
                            appendTo="body"
                            [placeholder]="t('parametrage.classes.form.niveauPlaceholder')">
                        </p-select>
                        <small style="color:var(--color-text-muted)">{{ t('parametrage.classes.form.niveauHelp') }}</small>
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

        <!-- Dialog désignation professeur principal -->
        <p-dialog
            [(visible)]="ppDialogVisible"
            [header]="t('parametrage.classes.professeurPrincipal.titre')"
            [modal]="true" [style]="{width:'420px'}" [closable]="!ppSaving()"
            (onHide)="closePpDialog()"
        >
            <p-fluid>
                <form [formGroup]="ppForm" class="flex flex-col gap-4 mt-1">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('parametrage.classes.professeurPrincipal.personnelId') }} <span style="color:var(--color-danger)">*</span></label>
                        <p-select formControlName="personnelId"
                            [options]="enseignantOptions()"
                            optionLabel="label" optionValue="value"
                            [filter]="true"
                            appendTo="body"
                            [placeholder]="t('parametrage.classes.professeurPrincipal.personnelPlaceholder')">
                        </p-select>
                        @if (ppForm.controls['personnelId'].invalid && ppForm.controls['personnelId'].touched) {
                            <small style="color:var(--color-danger)">{{ t('parametrage.commun.requis') }}</small>
                        }
                    </div>
                    @if (ppError()) {
                        <p-message severity="error" [text]="ppError()!"></p-message>
                    }
                </form>
            </p-fluid>
            <ng-template #footer>
                <button pButton severity="secondary" [label]="t('parametrage.commun.annuler')" [disabled]="ppSaving()" (click)="closePpDialog()"></button>
                <button pButton [label]="t('parametrage.commun.modifier')" [loading]="ppSaving()" (click)="onSubmitPp()"></button>
            </ng-template>
        </p-dialog>

        <gescol-delete-confirm-dialog
            [(visible)]="deleteVisible" [itemLabel]="deleteLabel" [deleteFn]="deleteFn" (deleted)="onDeleted()"
        ></gescol-delete-confirm-dialog>
    </ng-container>
    `
})
export class ClassesListe implements OnInit {
    private svc         = inject(ParametrageService);
    private authService = inject(AuthService);
    private fb          = inject(FormBuilder);
    private http        = inject(HttpClient);
    private transloco   = inject(TranslocoService);
    private activeLang  = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });

    @ViewChild('tableRef') tableRef!: GescolTableComponent;

    readonly data          = signal<PageResponse<ClasseResponse> | 'error' | undefined>(undefined);
    readonly dialogVisible = signal(false);
    readonly selectedItem  = signal<ClasseResponse | null>(null);
    readonly saving        = signal(false);
    readonly saveError     = signal<string | null>(null);

    readonly ppDialogVisible = signal(false);
    readonly ppTargetId      = signal<string | null>(null);
    readonly ppSaving        = signal(false);
    readonly ppError         = signal<string | null>(null);

    readonly anneeScolaireOptions = signal<AnneeScolaireOption[]>(getAnneeScolaireOptions());
    readonly niveauOptions        = signal<SelectOption[]>([]);
    readonly enseignantOptions    = signal<SelectOption[]>([]);

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    canWrite = () => {
        const r = this.authService.role();
        return r === 'SUPER_ADMIN' || r === 'SECRETARIAT';
    };

    readonly form = this.fb.group({
        libelle:      ['', Validators.required],
        sousSysteme:  [null as 'FRANCOPHONE' | 'ANGLOPHONE' | null, Validators.required],
        anneeScolaire:['', Validators.required],
        niveauId:     [null as string | null]
    });

    readonly ppForm = this.fb.group({
        personnelId: [null as string | null, Validators.required]
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
            { field: 'libelle',       header: t('parametrage.classes.cols.libelle'),       sortable: true },
            { field: 'niveauLibelle', header: t('parametrage.classes.cols.niveau') },
            { field: 'sousSysteme',   header: t('parametrage.classes.cols.sousSysteme') },
            { field: 'anneeScolaire', header: t('parametrage.classes.cols.anneeScolaire'), sortable: true, width: '120px' }
        ];
    }

    ngOnInit(): void {
        this.loadNiveaux();
        this.loadEnseignants();
    }

    private loadNiveaux(): void {
        this.svc.getNiveaux(0, 200, 'ordre,asc').subscribe({
            next: res => this.niveauOptions.set(res.content.map(n => ({ value: n.id, label: n.libelle }))),
            error: () => {}
        });
    }

    private loadEnseignants(): void {
        // /api/personnel n'a pas de filtre typePersonnel : on charge tout et filtre côté client
        const p = new HttpParams().set('page', '0').set('size', '200').set('sort', 'nom,asc');
        this.http.get<PageResponse<{ id: string; nom: string; prenom: string; typePersonnel: string }>>('/api/personnel', { params: p })
            .subscribe({
                next: res => {
                    const enseignants = res.content.filter(p => p.typePersonnel === 'ENSEIGNANT');
                    this.enseignantOptions.set(enseignants.map(e => ({ value: e.id, label: `${e.prenom} ${e.nom}` })));
                },
                error: () => {}
            });
    }

    onLoad(event: GescolLoadEvent): void {
        this.data.set(undefined);
        this.svc.getClasses(event.page, event.size, event.sort).subscribe({
            next:  res => this.data.set(res),
            error: ()  => this.data.set('error')
        });
    }

    openCreate(): void {
        this.selectedItem.set(null);
        this.anneeScolaireOptions.set(getAnneeScolaireOptions());
        this.form.reset({ libelle: '', sousSysteme: null, anneeScolaire: getAnneeScolaireCourante(), niveauId: null });
        this.saveError.set(null);
        this.dialogVisible.set(true);
    }

    openEdit(row: ClasseResponse): void {
        this.selectedItem.set(row);
        this.anneeScolaireOptions.set(getAnneeScolaireOptionsAvec(row.anneeScolaire));
        this.form.patchValue({ libelle: row.libelle, sousSysteme: row.sousSysteme, anneeScolaire: row.anneeScolaire, niveauId: row.niveauId });
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
        const req: any = { libelle: v.libelle!.trim(), sousSysteme: v.sousSysteme!, anneeScolaire: v.anneeScolaire!.trim() };
        if (v.niveauId) req.niveauId = v.niveauId;
        const item = this.selectedItem();
        const req$ = item ? this.svc.modifierClasse(item.id, req) : this.svc.creerClasse(req);
        req$.subscribe({
            next: () => { this.saving.set(false); this.dialogVisible.set(false); this.tableRef?.resetPage(); },
            error: (err) => {
                this.saving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.saveError.set(typeof msg === 'string' ? msg : this.transloco.translate('app.parametrage.erreurEnregistrement'));
            }
        });
    }

    // Désignation professeur principal
    openPpDialog(row: ClasseResponse): void {
        this.ppTargetId.set(row.id);
        this.ppForm.reset({ personnelId: row.professeurPrincipalId ?? null });
        this.ppError.set(null);
        this.ppDialogVisible.set(true);
    }

    closePpDialog(): void { if (!this.ppSaving()) this.ppDialogVisible.set(false); }

    onSubmitPp(): void {
        this.ppForm.markAllAsTouched();
        if (this.ppForm.invalid) return;
        const id = this.ppTargetId();
        if (!id) return;
        this.ppSaving.set(true);
        this.ppError.set(null);
        this.svc.designerProfesseurPrincipal(id, { personnelId: this.ppForm.getRawValue().personnelId! }).subscribe({
            next: () => { this.ppSaving.set(false); this.ppDialogVisible.set(false); this.tableRef?.resetPage(); },
            error: (err) => {
                this.ppSaving.set(false);
                const msg = err?.error?.message ?? err?.error?.detail ?? null;
                this.ppError.set(typeof msg === 'string' ? msg : this.transloco.translate('app.parametrage.erreurEnregistrement'));
            }
        });
    }

    onDeleteRequest(row: ClasseResponse): void {
        this.deleteLabel = row.libelle;
        this.deleteFn = () => this.svc.supprimerClasse(row.id);
        this.deleteVisible = true;
    }

    onDeleted(): void { this.deleteVisible = false; this.tableRef?.resetPage(); }
}
