import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { VitrineService, ActualiteResponse, ActualiteRequest } from '@/app/core/services/vitrine.service';
import { AuthService } from '@/app/core/services/auth.service';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';

@Component({
    selector: 'app-actualites-liste',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, DatePipe, FormsModule, TranslocoDirective,
        ButtonModule, InputTextModule, TagModule, TableModule,
        MessageModule, TooltipModule,
        DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">

        <!-- Bandeau de succès (navigation depuis le formulaire) -->
        @if (successKey()) {
            <p-message severity="success" styleClass="mb-4 w-full"
                [text]="t(successKey()!)">
            </p-message>
        }

        <div class="card">
            <!-- En-tête page -->
            <div class="flex justify-between items-start mb-5 flex-wrap gap-3">
                <div class="flex items-center gap-3">
                    <div style="width:48px;height:48px;border-radius:14px;background:var(--p-primary-50);
                                display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="pi pi-megaphone" style="font-size:1.4rem;color:var(--p-primary-color)"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-semibold m-0">{{ t('communication.actualites.titre') }}</h2>
                        <span class="text-sm" style="color:var(--p-surface-400)">
                            {{ items().length }}
                            {{ items().length > 1 ? 'articles publiés' : 'article publié' }}
                        </span>
                    </div>
                </div>
                @if (canWrite()) {
                    <button pButton icon="pi pi-plus"
                        [label]="t('communication.actualites.nouvelle')"
                        (click)="router.navigate(['/app/communication/actualites/nouvelle'])">
                    </button>
                }
            </div>

            <!-- Recherche + info limitation API -->
            <div class="flex flex-col gap-2 mb-4">
                <div style="position:relative;max-width:400px">
                    <i class="pi pi-search"
                       style="position:absolute;left:.75rem;top:50%;transform:translateY(-50%);
                              color:var(--p-surface-400);pointer-events:none;z-index:1"></i>
                    <input pInputText
                        [ngModel]="search()" (ngModelChange)="search.set($event)"
                        [placeholder]="t('communication.actualites.rechercheLabel')"
                        style="padding-left:2.5rem;width:100%" />
                </div>
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                     style="background:var(--p-blue-50,#eff6ff);border:1px solid var(--p-blue-100,#dbeafe);
                            color:var(--p-blue-600,#2563eb)">
                    <i class="pi pi-info-circle" style="flex-shrink:0"></i>
                    <span>{{ t('communication.actualites.limitationAdmin') }}</span>
                </div>
            </div>

            <!-- État de chargement -->
            @if (loading()) {
                <div class="flex justify-center py-12">
                    <i class="pi pi-spin pi-spinner"
                       style="font-size:2.2rem;color:var(--p-primary-color)"></i>
                </div>
            } @else if (loadError()) {
                <p-message severity="error" [text]="t('table.erreur')"></p-message>
            } @else {
                <p-table
                    [value]="filtered()"
                    styleClass="p-datatable-sm"
                    [rowHover]="true"
                    [paginator]="filtered().length > 15"
                    [rows]="15"
                    [showCurrentPageReport]="true"
                    currentPageReportTemplate="{first} – {last} sur {totalRecords}">

                    <ng-template #header>
                        <tr>
                            <th>{{ t('communication.actualites.cols.titre') }}</th>
                            <th style="width:140px">{{ t('communication.actualites.cols.datePublication') }}</th>
                            <th style="width:110px;text-align:center">
                                {{ t('communication.actualites.cols.statut') }}
                            </th>
                            @if (canWrite()) {
                                <th style="width:120px;text-align:center">{{ t('table.actions') }}</th>
                            }
                        </tr>
                    </ng-template>

                    <ng-template #body let-row>
                        <tr>
                            <!-- Titre + extrait -->
                            <td>
                                <div class="font-medium" style="line-height:1.4">{{ row.titre }}</div>
                                @if (excerpt(row)) {
                                    <div class="text-sm mt-0.5"
                                         style="color:var(--p-surface-400);line-height:1.4">
                                        {{ excerpt(row) }}
                                    </div>
                                }
                            </td>
                            <!-- Date -->
                            <td class="text-sm" style="color:var(--p-surface-500)">
                                {{ row.datePublication | date:'dd/MM/yyyy' }}
                            </td>
                            <!-- Statut -->
                            <td style="text-align:center">
                                <p-tag
                                    [value]="row.publie
                                        ? t('communication.actualites.cols.statuts.publie')
                                        : t('communication.actualites.cols.statuts.brouillon')"
                                    [severity]="row.publie ? 'success' : 'secondary'">
                                </p-tag>
                            </td>
                            <!-- Actions -->
                            @if (canWrite()) {
                                <td style="text-align:center">
                                    <div class="flex gap-1 justify-center">
                                        <button pButton icon="pi pi-pencil"
                                            class="p-button-text p-button-sm p-button-success"
                                            [pTooltip]="t('table.modifier')" tooltipPosition="top"
                                            (click)="onEdit(row)">
                                        </button>
                                        <button pButton
                                            [icon]="row.publie ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                            class="p-button-text p-button-sm"
                                            [class.p-button-warning]="row.publie"
                                            [class.p-button-info]="!row.publie"
                                            [pTooltip]="row.publie
                                                ? t('communication.actualites.cols.actions.depublier')
                                                : t('communication.actualites.cols.actions.publier')"
                                            tooltipPosition="top"
                                            [disabled]="toggling() === row.id"
                                            [loading]="toggling() === row.id"
                                            (click)="onToggle(row)">
                                        </button>
                                        <button pButton icon="pi pi-trash"
                                            class="p-button-text p-button-sm p-button-danger"
                                            [pTooltip]="t('table.supprimer')" tooltipPosition="top"
                                            (click)="onDelete(row)">
                                        </button>
                                    </div>
                                </td>
                            }
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td [attr.colspan]="canWrite() ? 4 : 3">
                                <div class="flex flex-col items-center py-14"
                                     style="color:var(--p-surface-300)">
                                    <i class="pi pi-megaphone"
                                       style="font-size:2.8rem;margin-bottom:12px;opacity:.5"></i>
                                    <p class="m-0 text-sm">{{ t('table.aucun') }}</p>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            }
        </div>

        <gescol-delete-confirm-dialog
            [(visible)]="deleteVisible"
            [itemLabel]="deleteLabel"
            [deleteFn]="deleteFn"
            (deleted)="onDeleted()">
        </gescol-delete-confirm-dialog>
    </ng-container>
    `
})
export class ActualitesListe implements OnInit {
    readonly router  = inject(Router);
    private svc      = inject(VitrineService);
    private auth     = inject(AuthService);

    readonly items     = signal<ActualiteResponse[]>([]);
    readonly loading   = signal(false);
    readonly loadError = signal(false);
    readonly toggling  = signal<string | null>(null);
    readonly successKey = signal<string | null>(null);
    readonly search    = signal('');

    readonly canWrite = computed(() => {
        const r = this.auth.role();
        return r === 'SUPER_ADMIN' || r === 'COMMUNICATION';
    });

    readonly filtered = computed(() => {
        const q = this.search().toLowerCase().trim();
        if (!q) return this.items();
        return this.items().filter(a => a.titre.toLowerCase().includes(q));
    });

    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => {};

    ngOnInit(): void {
        const s = (window.history.state ?? {}) as Record<string, unknown>;
        if (typeof s['successAction'] === 'string') {
            this.successKey.set(
                s['successAction'] === 'created'
                    ? 'communication.actualites.successCreation'
                    : 'communication.actualites.successModification'
            );
            setTimeout(() => this.successKey.set(null), 5000);
        }
        this.loadItems();
    }

    private loadItems(): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.svc.getActualitesAdmin(0, 200).subscribe({
            next: res => { this.items.set(res.content ?? []); this.loading.set(false); },
            error: ()  => { this.loadError.set(true); this.loading.set(false); }
        });
    }

    excerpt(row: ActualiteResponse): string {
        const text = (row.contenu ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 95 ? text.slice(0, 92) + '…' : text;
    }

    onEdit(row: ActualiteResponse): void {
        this.router.navigate(['/app/communication/actualites', row.id, 'editer']);
    }

    onToggle(row: ActualiteResponse): void {
        this.toggling.set(row.id);
        const req: ActualiteRequest = {
            titre:           row.titre,
            contenu:         row.contenu,
            datePublication: row.datePublication,
            imageUrl:        row.imageUrl ?? undefined,
            publie:          !row.publie
        };
        this.svc.modifierActualite(row.id, req).subscribe({
            next: updated => {
                this.items.update(list => list.map(a => a.id === updated.id ? updated : a));
                this.toggling.set(null);
            },
            error: () => this.toggling.set(null)
        });
    }

    onDelete(row: ActualiteResponse): void {
        this.deleteLabel   = row.titre;
        this.deleteFn      = () => this.svc.supprimerActualite(row.id);
        this.deleteVisible = true;
    }

    onDeleted(): void {
        this.deleteVisible = false;
        this.loadItems();
    }
}
