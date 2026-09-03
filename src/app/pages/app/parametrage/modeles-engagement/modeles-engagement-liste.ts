import { Component, ChangeDetectionStrategy, inject, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';
import { ParametrageService, ModeleLettreEngagementResponse } from '@/app/core/services/parametrage.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PageResponse } from '@/app/core/services/eleve.service';

@Component({
    selector: 'app-modeles-engagement-liste',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TranslocoDirective, ButtonModule,
        GescolTableComponent, DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">{{ t('parametrage.modelesEngagement.titre') }}</h2>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus" [label]="t('parametrage.modelesEngagement.nouveau')"
                        class="p-button-success"
                        (click)="router.navigate(['/app/parametrage/modeles-engagement/nouveau'])"></button>
                }
            </div>
            <gescol-table #tableRef
                [columns]="columns(t)"
                [data]="data()"
                [showView]="false"
                [showEdit]="canWrite()"
                [showDelete]="canWrite()"
                (load)="onLoad($event)"
                (edit)="onEdit($event)"
                (delete)="onDeleteRequest($event)"
            ></gescol-table>
        </div>

        <gescol-delete-confirm-dialog
            [(visible)]="deleteVisible" [itemLabel]="deleteLabel" [deleteFn]="deleteFn" (deleted)="onDeleted()"
        ></gescol-delete-confirm-dialog>
    </ng-container>
    `
})
export class ModelesEngagementListe {
    protected router = inject(Router);
    private svc         = inject(ParametrageService);
    private authService = inject(AuthService);

    @ViewChild('tableRef') tableRef!: GescolTableComponent;

    readonly data = signal<PageResponse<ModeleLettreEngagementResponse> | 'error' | undefined>(undefined);

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    canWrite = () => this.authService.role() === 'SUPER_ADMIN';

    columns(t: (k: string) => string): ColDef[] {
        return [
            { field: 'libelle', header: t('parametrage.modelesEngagement.cols.libelle'), sortable: false },
            { field: 'extrait', header: t('parametrage.modelesEngagement.cols.extrait') }
        ];
    }

    onLoad(event: GescolLoadEvent): void {
        this.data.set(undefined);
        this.svc.getModelesEngagement(event.page, event.size).subscribe({
            next: (res) => {
                const mapped = {
                    ...res,
                    content: res.content.map(m => ({
                        ...m,
                        extrait: m.contenu.length > 80 ? m.contenu.substring(0, 80) + '…' : m.contenu
                    }))
                };
                this.data.set(mapped);
            },
            error: () => this.data.set('error')
        });
    }

    onEdit(row: ModeleLettreEngagementResponse): void {
        this.router.navigate(['/app/parametrage/modeles-engagement', row.id, 'editer']);
    }

    onDeleteRequest(row: ModeleLettreEngagementResponse): void {
        this.deleteLabel = row.libelle;
        this.deleteFn = () => this.svc.supprimerModele(row.id);
        this.deleteVisible = true;
    }

    onDeleted(): void { this.deleteVisible = false; this.tableRef?.resetPage(); }
}
