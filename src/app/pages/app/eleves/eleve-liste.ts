import {
    Component, inject, signal, ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';
import { EleveService, EleveResponse, EleveSearchParams, PageResponse } from '@/app/core/services/eleve.service';
import { AuthService } from '@/app/core/services/auth.service';

@Component({
    selector: 'app-eleve-liste',
    standalone: true,
    imports: [
        FormsModule,
        TranslocoDirective,
        ButtonModule,
        InputTextModule,
        GescolTableComponent,
        DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <!-- En-tête -->
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">{{ t('eleves.titre') }}</h2>
                @if (canCreate()) {
                    <button pButton icon="pi pi-plus" [label]="t('eleves.nouveau')"
                        class="p-button-success"
                        (click)="router.navigate(['/app/eleves/nouveau'])"></button>
                }
            </div>

            <!-- Filtres de recherche -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <input pInputText type="text"
                    [(ngModel)]="filters.nom"
                    [placeholder]="t('eleves.filtres.nom')" />
                <input pInputText type="text"
                    [(ngModel)]="filters.prenom"
                    [placeholder]="t('eleves.filtres.prenom')" />
                <input pInputText type="text"
                    [(ngModel)]="filters.matricule"
                    [placeholder]="t('eleves.filtres.matricule')" />
                <input pInputText type="text"
                    [(ngModel)]="filters.classeLibelle"
                    [placeholder]="t('eleves.filtres.classe')" />
            </div>
            <div class="flex gap-2 mb-5">
                <button pButton icon="pi pi-search" [label]="t('eleves.filtres.rechercher')"
                    (click)="onSearch()"></button>
                <button pButton icon="pi pi-times" [label]="t('eleves.filtres.reinitialiser')"
                    class="p-button-outlined p-button-secondary"
                    (click)="onReset()"></button>
            </div>

            <!-- Table -->
            <gescol-table
                #tableRef
                [columns]="columns(t)"
                [data]="data()"
                [showView]="true"
                [showEdit]="canCreate()"
                [showDelete]="canCreate()"
                (load)="onLoad($event)"
                (view)="onView($event)"
                (edit)="onEdit($event)"
                (delete)="onDeleteRequest($event)"
            ></gescol-table>
        </div>

        <!-- Dialog de confirmation de suppression -->
        <gescol-delete-confirm-dialog
            [(visible)]="deleteVisible"
            [itemLabel]="deleteLabel"
            [deleteFn]="deleteFn"
            (deleted)="onDeleted()"
        ></gescol-delete-confirm-dialog>
    </ng-container>
    `
})
export class EleveListe {
    protected router      = inject(Router);
    private eleveService  = inject(EleveService);
    private authService   = inject(AuthService);

    @ViewChild('tableRef') tableRef!: GescolTableComponent;

    readonly data = signal<PageResponse<EleveResponse> | 'error' | undefined>(undefined);

    filters: EleveSearchParams = {};

    private currentSort = 'nom,asc';
    private pendingFilters: EleveSearchParams = {};

    /** Visible pour SUPER_ADMIN et SECRETARIAT */
    canCreate = () => {
        const r = this.authService.role();
        return r === 'SUPER_ADMIN' || r === 'SECRETARIAT';
    };

    columns(t: (k: string) => string): ColDef[] {
        return [
            { field: 'matricule',    header: t('eleves.colonnes.matricule'),  width: '130px' },
            { field: 'nom',          header: t('eleves.colonnes.nom'),         sortable: true },
            { field: 'prenom',       header: t('eleves.colonnes.prenom') },
            { field: 'classeLibelle',header: t('eleves.colonnes.classe') },
            { field: 'sexe',         header: t('eleves.colonnes.sexe'),        width: '70px' },
            { field: 'dateNaissance',header: t('eleves.colonnes.naissance'),   date: true, width: '120px', sortable: false }
        ];
    }

    // Déclenché par GescolTable à l'init et sur changement de page/tri
    onLoad(event: GescolLoadEvent): void {
        this.currentSort = event.sort;
        this.loadData(event.page, event.size, event.sort);
    }

    onSearch(): void {
        this.pendingFilters = { ...this.filters };
        this.tableRef?.resetPage(); // revient page 1, déclenche un nouvel onLoad via dt.reset()
    }

    onReset(): void {
        this.filters = {};
        this.pendingFilters = {};
        this.tableRef?.resetPage();
    }

    onView(row: EleveResponse): void {
        this.router.navigate(['/app/fiche-eleve']);
    }

    onEdit(row: EleveResponse): void {
        this.router.navigate(['/app/eleves', row.id, 'editer']);
    }

    // --- Suppression ---
    deleteVisible = false;
    deleteLabel = '';
    deleteFn: () => any = () => { throw new Error('deleteFn not set'); };

    onDeleteRequest(row: EleveResponse): void {
        this.deleteLabel = `${row.prenom} ${row.nom}`;
        this.deleteFn = () => this.eleveService.supprimer(row.id);
        this.deleteVisible = true;
    }

    onDeleted(): void {
        this.deleteVisible = false;
        this.tableRef?.resetPage();
    }

    private loadData(page: number, size: number, sort: string): void {
        this.data.set(undefined);
        this.eleveService.rechercher(this.pendingFilters, page, size, sort).subscribe({
            next:  (res) => this.data.set(res),
            error: ()    => this.data.set('error')
        });
    }
}
