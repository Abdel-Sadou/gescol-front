import {
    Component, Input, Output, EventEmitter, ViewChild
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TranslocoModule } from '@jsverse/transloco';
import type { PageResponse } from '@/app/core/services/eleve.service';

export interface ColDef {
    field: string;
    header: string;           // déjà traduit par le parent
    sortable?: boolean;       // whitelist de tri : n'activer que les champs autorisés par le backend
    width?: string;
    date?: boolean;           // afficher comme date DD/MM/YYYY
    boolean?: boolean;        // afficher comme badge oui/non
    booleanTrueLabel?: string;
    booleanFalseLabel?: string;
}

export interface GescolLoadEvent {
    page: number;
    size: number;
    sort: string;   // ex. 'nom,asc'
}

@Component({
    selector: 'gescol-table',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, TooltipModule, MessageModule, TagModule, TranslocoModule, DatePipe],
    styles: [`.gescol-row-selected td { background: var(--p-highlight-bg) !important; }`],
    template: `
        <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
            @if (state === 'error') {
                <div class="p-4">
                    <p-message severity="error" [text]="t('table.erreur')"></p-message>
                </div>
            } @else {
                <!-- La table est toujours rendue : onLazyLoad déclenche le premier chargement.
                     [loading] affiche l'overlay PrimeNG sans supprimer le DOM. -->
                <p-table
                    #dt
                    [value]="rows"
                    [lazy]="true"
                    [loading]="state === 'loading'"
                    [paginator]="true"
                    [rows]="pageSize"
                    [totalRecords]="total"
                    [rowHover]="true"
                    [showCurrentPageReport]="true"
                    [currentPageReportTemplate]="t('table.pageReport')"
                    styleClass="p-datatable-sm"
                    (onLazyLoad)="onLazy($event)"
                >
                    <ng-template #header>
                        <tr>
                            @for (col of columns; track col.field) {
                                @if (col.sortable) {
                                    <th [pSortableColumn]="col.field" [style]="col.width ? 'width:' + col.width : ''">
                                        <span class="flex items-center gap-1">
                                            {{ col.header }}
                                            <p-sortIcon [field]="col.field"></p-sortIcon>
                                        </span>
                                    </th>
                                } @else {
                                    <th [style]="col.width ? 'width:' + col.width : ''">{{ col.header }}</th>
                                }
                            }
                            @if (showView || showEdit || showDelete || showToggleActive || showCustomAction) {
                                <th style="width:150px;text-align:center">{{ t('table.actions') }}</th>
                            }
                        </tr>
                    </ng-template>
                    <ng-template #body let-row>
                        <tr [class.gescol-row-selected]="selectedId && row['id'] === selectedId">
                            @for (col of columns; track col.field) {
                                <td>
                                    @if (col.boolean) {
                                        <p-tag
                                            [value]="row[col.field] ? (col.booleanTrueLabel ?? 'Oui') : (col.booleanFalseLabel ?? 'Non')"
                                            [severity]="row[col.field] ? 'success' : 'danger'">
                                        </p-tag>
                                    } @else if (col.date) {
                                        {{ row[col.field] | date:'dd/MM/yyyy' }}
                                    } @else {
                                        {{ row[col.field] }}
                                    }
                                </td>
                            }
                            @if (showView || showEdit || showDelete || showToggleActive || showCustomAction) {
                                <td style="text-align:center">
                                    <div class="flex gap-1 justify-center">
                                        @if (showView) {
                                            <button pButton [icon]="iconView"
                                                class="p-button-text p-button-sm p-button-info"
                                                [pTooltip]="tooltipView || t('table.voir')" tooltipPosition="top"
                                                (click)="view.emit(row)"></button>
                                        }
                                        @if (showEdit) {
                                            <button pButton icon="pi pi-pencil"
                                                class="p-button-text p-button-sm p-button-success"
                                                [pTooltip]="t('table.modifier')" tooltipPosition="top"
                                                (click)="edit.emit(row)"></button>
                                        }
                                        @if (showToggleActive) {
                                            <button pButton
                                                [icon]="row['actif'] ? 'pi pi-pause' : 'pi pi-play'"
                                                [class]="row['actif'] ? 'p-button-text p-button-sm p-button-warning' : 'p-button-text p-button-sm p-button-success'"
                                                [pTooltip]="row['actif'] ? tooltipDeactivate : tooltipReactivate"
                                                tooltipPosition="top"
                                                (click)="toggleActive.emit(row)"></button>
                                        }
                                        @if (showCustomAction && customActionCondition(row)) {
                                            <button pButton [icon]="iconCustomAction"
                                                [class]="customActionSeverity"
                                                [pTooltip]="tooltipCustomAction" tooltipPosition="top"
                                                (click)="customAction.emit(row)"></button>
                                        }
                                        @if (showDelete) {
                                            <button pButton icon="pi pi-trash"
                                                class="p-button-text p-button-sm p-button-danger"
                                                [pTooltip]="t('table.supprimer')" tooltipPosition="top"
                                                (click)="delete.emit(row)"></button>
                                        }
                                    </div>
                                </td>
                            }
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td [attr.colspan]="columns.length + (showView || showEdit || showDelete || showToggleActive ? 1 : 0)"
                                class="text-center py-8 text-surface-400">
                                {{ t('table.aucun') }}
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            }
        </ng-container>
    `
})
export class GescolTableComponent {
    @Input() columns: ColDef[] = [];
    @Input() data: PageResponse<any> | 'error' | undefined = undefined;
    @Input() pageSize = 20;
    @Input() showView = false;
    @Input() showEdit = true;
    @Input() showDelete = true;
    @Input() showToggleActive = false;
    @Input() tooltipDeactivate = '';
    @Input() tooltipReactivate = '';
    @Input() tooltipView = '';
    @Input() iconView = 'pi pi-eye';
    @Input() selectedId: string | null = null;
    // Action personnalisée optionnelle — conditionnelle par ligne.
    @Input() showCustomAction  = false;
    @Input() iconCustomAction  = 'pi pi-user-plus';
    @Input() tooltipCustomAction = '';
    @Input() customActionSeverity = 'p-button-text p-button-sm p-button-info';
    @Input() customActionCondition: (row: any) => boolean = () => true;
    @Output() load         = new EventEmitter<GescolLoadEvent>();
    @Output() view         = new EventEmitter<any>();
    @Output() edit         = new EventEmitter<any>();
    @Output() delete       = new EventEmitter<any>();
    @Output() toggleActive = new EventEmitter<any>();
    @Output() customAction = new EventEmitter<any>();

    @ViewChild('dt') dt!: Table;

    get state(): 'loading' | 'error' | 'data' {
        if (this.data === undefined) return 'loading';
        if (this.data === 'error')   return 'error';
        return 'data';
    }

    get rows(): any[] {
        if (this.data === undefined || this.data === 'error') return [];
        return (this.data as PageResponse<any>).content;
    }

    get total(): number {
        if (this.data === undefined || this.data === 'error') return 0;
        return (this.data as PageResponse<any>).totalElements;
    }

    /** Appeler depuis le parent après changement de filtres pour revenir à la page 1. */
    resetPage(): void {
        if (this.dt) {
            this.dt.reset();
        }
    }

    protected onLazy(event: TableLazyLoadEvent): void {
        const first = event.first ?? 0;
        const rows  = event.rows  ?? this.pageSize;
        const page  = Math.floor(first / rows);
        const rawField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
        const sortField = typeof rawField === 'string' ? rawField : 'nom';
        const sortOrder = event.sortOrder === -1 ? 'desc' : 'asc';
        this.load.emit({ page, size: rows, sort: `${sortField},${sortOrder}` });
    }
}
