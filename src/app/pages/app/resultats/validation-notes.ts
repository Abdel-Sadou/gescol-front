import {
    ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { NoteSelecteur, SelecteurResult } from './note-selecteur';
import { ResultatsService, NoteResponse } from '@/app/core/services/resultats.service';

@Component({
    selector: 'app-validation-notes',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, CheckboxModule, DialogModule, MessageModule, SkeletonModule,
        NoteSelecteur
    ],
    styles: [`
        :host { display: block; padding: 24px; max-width: 1000px; }
        h1 { font-size: 22px; font-weight: 700; margin: 0 0 6px; color: var(--color-text); }
        .vn-sub { font-size: 13px; color: var(--color-text-muted); margin: 0 0 20px; }
        .vn-selecteur { margin-bottom: 20px; }

        /* ── Barre contextuelle collante ── */
        .vn-sticky-bar {
            position: sticky; top: 0; z-index: 20;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: 11px 16px;
            display: flex; justify-content: space-between; align-items: center;
            gap: 12px; flex-wrap: wrap;
            box-shadow: 0 2px 10px rgba(0,0,0,0.07);
            margin-bottom: 16px;
        }
        .vn-context { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .vn-ctx-chip {
            background: var(--color-primary-soft); color: var(--color-primary);
            border-radius: 4px; padding: 3px 10px;
            font-size: 12px; font-weight: 700;
        }
        .vn-ctx-sep { color: var(--color-border-field); font-size: 11px; }
        .vn-bar-right { display: flex; align-items: center; gap: 12px; }
        .vn-val-ok {
            font-size: 12px; color: #15803d; font-weight: 600;
            display: flex; align-items: center; gap: 5px;
        }

        /* ── Tableau + actions sticky ── */
        .vn-table-outer { position: relative; }
        .vn-table-wrap {
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md) var(--radius-md) 0 0;
            overflow: hidden;
            border-bottom: 0;
        }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
            background: var(--color-surface-alt); padding: 10px 14px;
            text-align: left; font-weight: 700; font-size: 11px;
            text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted);
            border-bottom: 1px solid var(--color-border);
        }
        thead th:first-child { width: 44px; text-align: center; }
        thead th.th-note { text-align: center; }
        tbody tr { border-bottom: 1px solid var(--color-border); }
        tbody tr:last-child { border-bottom: 0; }
        tbody tr:hover { background: var(--color-surface-alt); }
        tbody tr.vn-row--selected { background: var(--color-primary-soft); }
        tbody td { padding: 9px 14px; color: var(--color-text); vertical-align: middle; }
        tbody td:first-child { text-align: center; }
        tbody td.td-note { text-align: center; font-size: 15px; font-weight: 700; color: var(--color-primary); }
        .vn-matricule { font-family: monospace; color: var(--color-text-muted); font-size: 11px; }
        .vn-note-null {
            display: inline-flex; align-items: center; gap: 4px;
            color: var(--color-text-muted); font-size: 13px; font-weight: 400;
        }
        .vn-note-null i { font-size: 11px; color: #f59e0b; }

        /* ── Barre d'actions sticky bas ── */
        .vn-actions {
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 16px;
            background: var(--color-surface-alt);
            border: 1px solid var(--color-border);
            border-radius: 0 0 var(--radius-md) var(--radius-md);
            position: sticky; bottom: 0; z-index: 10;
        }
        .vn-count { font-size: 13px; color: var(--color-text-muted); }
        .vn-count strong { color: var(--color-text); }
        .vn-null-warn {
            font-size: 12px; color: #92400e;
            display: flex; align-items: center; gap: 5px;
        }
        .vn-null-warn i { color: #f59e0b; font-size: 13px; }

        /* ── États vide / erreur ── */
        .vn-empty {
            padding: 40px; text-align: center;
            color: var(--color-text-muted); font-size: 14px;
        }
        .vn-r21 {
            background: #fff7ed; border: 1px solid #fdba74;
            border-left: 4px solid #f97316; border-radius: var(--radius-md);
            padding: 12px 16px; font-size: 13px; color: #9a3412;
            margin-bottom: 16px; display: flex; align-items: flex-start; gap: 10px;
        }

        /* ── Dialog confirmation ── */
        .vn-confirm-body { font-size: 14px; color: var(--color-text-body); line-height: 1.6; }
        .vn-confirm-body strong { color: var(--color-text); }
        .vn-confirm-warn {
            background: #fff7ed; border: 1px solid #fdba74;
            border-left: 4px solid #f97316; border-radius: var(--radius-md);
            padding: 10px 14px; font-size: 13px; color: #9a3412;
            margin-top: 14px; display: flex; align-items: flex-start; gap: 9px;
        }
        .vn-confirm-warn i { flex-shrink: 0; margin-top: 1px; }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <h1>
            <i class="pi pi-check-square mr-2" style="color:var(--color-primary)"></i>
            {{ t('resultats.validation.titre') }}
        </h1>
        <p class="vn-sub">{{ t('resultats.validation.sousTitre') }}</p>

        <div class="vn-selecteur">
            <note-selecteur mode="validation" (selectionChange)="onSelection($event)"></note-selecteur>
        </div>

        @if (loadError()) {
            <p-message severity="error" [text]="t('resultats.validation.erreurChargement')"></p-message>
        }

        @if (r21Error()) {
            <div class="vn-r21">
                <i class="pi pi-exclamation-triangle" style="margin-top:1px;flex-shrink:0"></i>
                <span>{{ r21Error() }}</span>
            </div>
        }

        @if (selection(); as sel) {

            <!-- ── Barre contextuelle collante ── -->
            <div class="vn-sticky-bar">
                <div class="vn-context">
                    <span class="vn-ctx-chip">{{ sel.sequenceLibelle }}</span>
                    <i class="pi pi-angle-right vn-ctx-sep"></i>
                    <span class="vn-ctx-chip">{{ sel.classeLibelle }}</span>
                    <i class="pi pi-angle-right vn-ctx-sep"></i>
                    <span class="vn-ctx-chip">{{ sel.matiereLibelle }}</span>
                </div>
                @if (lastValidatedCount() > 0) {
                    <div class="vn-bar-right">
                        <span class="vn-val-ok">
                            <i class="pi pi-check-circle"></i>
                            {{ lastValidatedCount() }} {{ t('resultats.validation.notesValideesCount') }}
                        </span>
                    </div>
                }
            </div>

            <!-- ── Corps ── -->
            @if (loading()) {
                <div class="vn-table-outer">
                    <div class="vn-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>{{ t('resultats.validation.colMatricule') }}</th>
                                    <th>{{ t('resultats.validation.colNom') }}</th>
                                    <th class="th-note">{{ t('resultats.validation.colNote') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (i of [1,2,3,4,5]; track i) {
                                    <tr>
                                        <td><p-skeleton width="18px" height="18px"></p-skeleton></td>
                                        <td><p-skeleton width="80px" height="14px"></p-skeleton></td>
                                        <td><p-skeleton width="160px" height="14px"></p-skeleton></td>
                                        <td><p-skeleton width="40px" height="14px"></p-skeleton></td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            } @else if (notes().length === 0 && lastValidatedCount() === 0) {
                <div class="vn-empty">{{ t('resultats.validation.aucuneNote') }}</div>
            } @else if (notes().length === 0 && lastValidatedCount() > 0) {
                <div class="vn-empty">{{ t('resultats.validation.toutesValidees') }}</div>
            } @else {
                <div class="vn-table-outer">
                    <div class="vn-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <p-checkbox
                                            [ngModel]="allSelected()"
                                            [binary]="true"
                                            (ngModelChange)="toggleAll($event)">
                                        </p-checkbox>
                                    </th>
                                    <th>{{ t('resultats.validation.colMatricule') }}</th>
                                    <th>{{ t('resultats.validation.colNom') }}</th>
                                    <th class="th-note">{{ t('resultats.validation.colNote') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (note of notes(); track note.id) {
                                    <tr
                                        [class.vn-row--selected]="selectedIds().has(note.id)"
                                        (click)="toggleRow(note.id, !selectedIds().has(note.id))"
                                        style="cursor:pointer">
                                        <td (click)="$event.stopPropagation()">
                                            <p-checkbox
                                                [ngModel]="selectedIds().has(note.id)"
                                                [binary]="true"
                                                (ngModelChange)="toggleRow(note.id, $event)">
                                            </p-checkbox>
                                        </td>
                                        <td class="vn-matricule">{{ note.eleveMatricule }}</td>
                                        <td>{{ note.elevePrenom }} {{ note.eleveNom }}</td>
                                        <td class="td-note">
                                            @if (note.valeur !== null && note.valeur !== undefined) {
                                                {{ note.valeur }}
                                            } @else {
                                                <span class="vn-note-null"
                                                    [title]="t('resultats.validation.noteNullTitle')">
                                                    <i class="pi pi-exclamation-circle"></i>
                                                    —
                                                </span>
                                            }
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>

                    <!-- ── Barre d'actions sticky bas ── -->
                    <div class="vn-actions">
                        <span class="vn-count">
                            <strong>{{ selectedIds().size }}</strong> / {{ notes().length }}
                            {{ t('resultats.validation.selectionnes') }}
                        </span>
                        <div style="display:flex;align-items:center;gap:14px">
                            @if (hasNullNotes()) {
                                <span class="vn-null-warn">
                                    <i class="pi pi-exclamation-triangle"></i>
                                    {{ nullNotesCount() }} {{ t('resultats.validation.notesSansValeur') }}
                                </span>
                            }
                            <p-button
                                [label]="t('resultats.validation.valider')"
                                icon="pi pi-lock"
                                severity="success"
                                [loading]="validating()"
                                [disabled]="validating() || selectedIds().size === 0"
                                (onClick)="onValider()">
                            </p-button>
                        </div>
                    </div>
                </div>
            }
        }

        <!-- ── Dialog confirmation irréversible ── -->
        <p-dialog
            [visible]="confirmVisible()"
            (visibleChange)="onConfirmDialogChange($event)"
            [modal]="true"
            [style]="{ width: '460px' }"
            [closable]="!validating()"
            [header]="t('resultats.validation.confirmerTitre')">
            <div class="vn-confirm-body">
                <p style="margin:0">
                    {{ t('resultats.validation.confirmerMessage', { n: selectedIds().size }) }}
                </p>
                @if (hasNullNotes()) {
                    <div class="vn-confirm-warn">
                        <i class="pi pi-exclamation-triangle"></i>
                        <span>{{ t('resultats.validation.avertissementNulles', { n: nullNotesCount() }) }}</span>
                    </div>
                }
            </div>
            <ng-template #footer>
                <button pButton severity="secondary"
                    [label]="t('resultats.validation.annuler')"
                    [disabled]="validating()"
                    (click)="confirmVisible.set(false)">
                </button>
                <button pButton severity="success"
                    [label]="t('resultats.validation.confirmer')"
                    [loading]="validating()"
                    (click)="confirmValider()">
                </button>
            </ng-template>
        </p-dialog>
    </ng-container>
    `
})
export class ValidationNotes implements OnInit {
    private resultatsService = inject(ResultatsService);

    readonly selection          = signal<SelecteurResult | null>(null);
    readonly loading            = signal(false);
    readonly validating         = signal(false);
    readonly loadError          = signal(false);
    readonly r21Error           = signal<string | null>(null);
    readonly notes              = signal<NoteResponse[]>([]);
    readonly selectedIds        = signal<Set<string>>(new Set());
    readonly lastValidatedCount = signal(0);
    readonly confirmVisible     = signal(false);

    readonly allSelected = computed(() => {
        const n = this.notes();
        return n.length > 0 && this.selectedIds().size === n.length;
    });

    readonly hasNullNotes = computed(() => {
        const sel = this.selectedIds();
        return this.notes().some(n => sel.has(n.id) && (n.valeur === null || n.valeur === undefined));
    });

    readonly nullNotesCount = computed(() => {
        const sel = this.selectedIds();
        return this.notes().filter(n => sel.has(n.id) && (n.valeur === null || n.valeur === undefined)).length;
    });

    ngOnInit(): void {}

    onSelection(sel: SelecteurResult | null): void {
        this.selection.set(sel);
        this.notes.set([]);
        this.selectedIds.set(new Set());
        this.r21Error.set(null);
        this.lastValidatedCount.set(0);
        this.confirmVisible.set(false);
        if (!sel) return;
        this.load(sel);
    }

    private load(sel: SelecteurResult): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.resultatsService
            .getNotesByClasseMatiereSequence(sel.classeId, sel.matiereId, sel.sequenceId)
            .subscribe({
                next: all => {
                    this.notes.set(all.filter(n => n.statut === 'BROUILLON'));
                    this.selectedIds.set(new Set());
                    this.loading.set(false);
                },
                error: () => {
                    this.loadError.set(true);
                    this.loading.set(false);
                }
            });
    }

    toggleRow(id: string, checked: boolean): void {
        const set = new Set(this.selectedIds());
        if (checked) set.add(id); else set.delete(id);
        this.selectedIds.set(set);
    }

    toggleAll(checked: boolean): void {
        this.selectedIds.set(checked ? new Set(this.notes().map(n => n.id)) : new Set());
    }

    onValider(): void {
        if (this.selectedIds().size === 0) return;
        this.confirmVisible.set(true);
    }

    onConfirmDialogChange(visible: boolean): void {
        if (!visible && !this.validating()) this.confirmVisible.set(false);
    }

    confirmValider(): void {
        const ids = [...this.selectedIds()];
        if (ids.length === 0) return;

        this.validating.set(true);
        this.r21Error.set(null);

        this.resultatsService.validerNotes({ noteIds: ids }).subscribe({
            next: () => {
                const count = ids.length;
                this.validating.set(false);
                this.confirmVisible.set(false);
                this.lastValidatedCount.set(count);
                this.notes.set(this.notes().filter(n => !this.selectedIds().has(n.id)));
                this.selectedIds.set(new Set());
            },
            error: err => {
                this.validating.set(false);
                this.confirmVisible.set(false);
                const msg = err?.error?.message;
                this.r21Error.set(typeof msg === 'string' ? msg : 'Erreur lors de la validation.');
            }
        });
    }
}
