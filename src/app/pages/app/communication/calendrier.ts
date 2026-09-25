import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { VitrineService, EvenementCalendrierResponse } from '@/app/core/services/vitrine.service';
import { AuthService } from '@/app/core/services/auth.service';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';

const dateRangeValidator: ValidatorFn = (group: AbstractControl) => {
    const debut = group.get('dateDebut')?.value as Date | null;
    const fin   = group.get('dateFin')?.value  as Date | null;
    if (debut && fin && fin <= debut) return { dateRange: true };
    return null;
};

@Component({
    selector: 'app-calendrier',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, DatePipe, ReactiveFormsModule, TranslocoDirective,
        ButtonModule, DialogModule, InputTextModule, TextareaModule, TagModule,
        DatePickerModule, MessageModule, FluidModule, TableModule,
        DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">
                    <i class="pi pi-calendar mr-2" style="color:var(--color-primary)"></i>
                    {{ t('communication.calendrier.titre') }}
                </h2>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus"
                        [label]="t('communication.calendrier.nouvelEvenement')"
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
                            <th>{{ t('communication.calendrier.cols.libelle') }}</th>
                            <th style="width:110px">{{ t('communication.calendrier.cols.dateDebut') }}</th>
                            <th style="width:110px">{{ t('communication.calendrier.cols.dateFin') }}</th>
                            <th style="width:100px;text-align:center">Statut</th>
                            @if (canWrite()) {
                                <th style="width:90px;text-align:center">{{ t('table.actions') }}</th>
                            }
                        </tr>
                    </ng-template>
                    <ng-template #body let-row>
                        <tr [class.opacity-50]="isPast(row)">
                            <td>
                                <div class="font-medium">{{ row.libelle }}</div>
                                @if (row.description) {
                                    <div class="text-sm mt-1" style="color:var(--p-surface-500)">
                                        {{ row.description }}
                                    </div>
                                }
                            </td>
                            <td class="text-sm">{{ row.dateDebut | date:'dd/MM/yyyy' }}</td>
                            <td class="text-sm">{{ row.dateFin ? (row.dateFin | date:'dd/MM/yyyy') : '—' }}</td>
                            <td style="text-align:center">
                                <p-tag [value]="t('communication.calendrier.badge.' + eventStatus(row))"
                                       [severity]="eventSeverity(row)">
                                </p-tag>
                            </td>
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
                            <td [attr.colspan]="canWrite() ? 5 : 4">
                                <div class="flex flex-col items-center py-12"
                                     style="color:var(--p-surface-300)">
                                    <i class="pi pi-calendar"
                                       style="font-size:2.8rem;margin-bottom:12px;opacity:.5"></i>
                                    <p class="m-0 text-sm">{{ t('table.aucun') }}</p>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            }
        </div>

        <!-- Dialog événement -->
        <p-dialog
            [visible]="dialogVisible()" (visibleChange)="onDialogChange($event)"
            [header]="editTarget() ? t('communication.calendrier.form.titreEdition') : t('communication.calendrier.form.titreCreation')"
            [modal]="true" [style]="{width:'520px'}" [closable]="!saving()">
            <p-fluid>
                <form [formGroup]="form" class="flex flex-col gap-4 mt-1">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">
                            {{ t('communication.calendrier.form.libelle') }}
                            <span style="color:var(--color-danger)">*</span>
                        </label>
                        <input pInputText formControlName="libelle"
                            [placeholder]="t('communication.calendrier.form.libellePh')" />
                        @if (form.controls['libelle'].invalid && form.controls['libelle'].touched) {
                            <small style="color:var(--color-danger)">{{ t('communication.commun.requis') }}</small>
                        }
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">{{ t('communication.calendrier.form.description') }}</label>
                        <textarea pTextarea formControlName="description" rows="4"
                            [placeholder]="t('communication.calendrier.form.descriptionPh')"
                            style="resize:vertical"></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="font-semibold text-sm">
                                {{ t('communication.calendrier.form.dateDebut') }}
                                <span style="color:var(--color-danger)">*</span>
                            </label>
                            <p-datepicker formControlName="dateDebut"
                                dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body">
                            </p-datepicker>
                            @if (form.controls['dateDebut'].invalid && form.controls['dateDebut'].touched) {
                                <small style="color:var(--color-danger)">{{ t('communication.commun.requis') }}</small>
                            }
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="font-semibold text-sm">{{ t('communication.calendrier.form.dateFinCourt') }}</label>
                            <p-datepicker formControlName="dateFin"
                                dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body">
                            </p-datepicker>
                            @if (form.hasError('dateRange') && form.controls['dateFin'].touched) {
                                <small style="color:var(--color-danger)">
                                    {{ t('communication.calendrier.form.dateFinInvalide') }}
                                </small>
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
export class Calendrier implements OnInit {
    private svc  = inject(VitrineService);
    private auth = inject(AuthService);
    private fb   = inject(FormBuilder);
    private t9n  = inject(TranslocoService);

    readonly items        = signal<EvenementCalendrierResponse[]>([]);
    readonly loading      = signal(false);
    readonly loadError    = signal(false);
    readonly dialogVisible = signal(false);
    readonly editTarget   = signal<EvenementCalendrierResponse | null>(null);
    readonly saving       = signal(false);
    readonly saveError    = signal<string | null>(null);

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    readonly canWrite = computed(() => {
        const r = this.auth.role();
        return r === 'SUPER_ADMIN' || r === 'COMMUNICATION';
    });

    readonly form = this.fb.group({
        libelle:     ['', Validators.required],
        description: [''],
        dateDebut:   [null as Date | null, Validators.required],
        dateFin:     [null as Date | null]
    }, { validators: dateRangeValidator });

    ngOnInit(): void { this.loadItems(); }

    private loadItems(): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.svc.getCalendrier().subscribe({
            next: items => { this.items.set(items); this.loading.set(false); },
            error: ()  => { this.loadError.set(true); this.loading.set(false); }
        });
    }

    openCreate(): void {
        this.editTarget.set(null);
        this.form.reset();
        this.saveError.set(null);
        this.dialogVisible.set(true);
    }

    openEdit(item: EvenementCalendrierResponse): void {
        this.editTarget.set(item);
        this.form.patchValue({
            libelle:     item.libelle,
            description: item.description ?? '',
            dateDebut:   item.dateDebut ? new Date(item.dateDebut + 'T00:00:00') : null,
            dateFin:     item.dateFin   ? new Date(item.dateFin   + 'T00:00:00') : null
        });
        this.saveError.set(null);
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
            libelle:     v.libelle!.trim(),
            description: v.description?.trim() || undefined,
            dateDebut:   this.formatDate(v.dateDebut!),
            dateFin:     v.dateFin ? this.formatDate(v.dateFin) : undefined
        };

        const target = this.editTarget();
        const req$ = target
            ? this.svc.modifierEvenement(target.id, req)
            : this.svc.creerEvenement(req);

        req$.subscribe({
            next: () => { this.saving.set(false); this.dialogVisible.set(false); this.loadItems(); },
            error: err => {
                this.saving.set(false);
                const msg = err?.error?.message ?? null;
                this.saveError.set(typeof msg === 'string' ? msg : this.t9n.translate('app.communication.commun.erreurEnregistrement'));
            }
        });
    }

    onDelete(item: EvenementCalendrierResponse): void {
        this.deleteLabel = item.libelle;
        this.deleteFn = () => this.svc.supprimerEvenement(item.id);
        this.deleteVisible = true;
    }

    onDeleted(): void { this.deleteVisible = false; this.loadItems(); }

    isPast(row: EvenementCalendrierResponse): boolean {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const fin = row.dateFin ? new Date(row.dateFin + 'T00:00:00') : new Date(row.dateDebut + 'T00:00:00');
        return fin < today;
    }

    eventStatus(row: EvenementCalendrierResponse): 'passe' | 'avenir' | 'enCours' {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const debut = new Date(row.dateDebut + 'T00:00:00');
        const fin   = row.dateFin ? new Date(row.dateFin + 'T00:00:00') : debut;
        if (fin < today)   return 'passe';
        if (debut > today) return 'avenir';
        return 'enCours';
    }

    eventSeverity(row: EvenementCalendrierResponse): 'secondary' | 'info' | 'success' {
        const s = this.eventStatus(row);
        if (s === 'passe')   return 'secondary';
        if (s === 'avenir')  return 'info';
        return 'success';
    }

    private formatDate(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const j = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${j}`;
    }
}
