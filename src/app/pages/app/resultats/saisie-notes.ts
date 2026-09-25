import {
    ChangeDetectionStrategy, Component, HostListener, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { NoteSelecteur, SelecteurResult } from './note-selecteur';
import { ResultatsService, NoteResponse } from '@/app/core/services/resultats.service';

@Component({
    selector: 'app-saisie-notes',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, InputNumberModule, TagModule, MessageModule, SkeletonModule,
        NoteSelecteur
    ],
    styles: [`
        :host { display: block; padding: 24px; max-width: 1000px; }
        h1 { font-size: 22px; font-weight: 700; margin: 0 0 6px; color: var(--color-text); }
        .sn-sub { font-size: 13px; color: var(--color-text-muted); margin: 0 0 20px; }
        .sn-selecteur { margin-bottom: 20px; }

        /* ── Barre contextuelle collante ── */
        .sn-sticky-bar {
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
        .sn-context { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .sn-ctx-chip {
            background: var(--color-primary-soft); color: var(--color-primary);
            border-radius: 4px; padding: 3px 10px;
            font-size: 12px; font-weight: 700;
        }
        .sn-ctx-sep { color: var(--color-border-field); font-size: 11px; }
        .sn-bar-right { display: flex; align-items: center; gap: 12px; }
        .sn-dirty-badge {
            font-size: 12px; color: #b45309; font-weight: 600;
            display: flex; align-items: center; gap: 5px;
        }
        .sn-dirty-badge::before {
            content: ''; width: 7px; height: 7px; border-radius: 50%;
            background: #f59e0b; display: inline-block;
        }
        .sn-save-ok { font-size: 12px; color: #15803d; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .sn-save-err { font-size: 12px; color: var(--color-danger); font-weight: 600; max-width: 280px; }

        /* ── Tableau ── */
        .sn-legende {
            display: flex; align-items: center; gap: 7px;
            font-size: 12px; color: var(--color-text-muted);
            margin-bottom: 8px;
        }
        .sn-legende-dot {
            width: 12px; height: 12px; border-radius: 3px;
            background: #fef9c3; border: 1px solid #fde68a; flex-shrink: 0;
        }
        .sn-table-wrap { border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
            background: var(--color-surface-alt); padding: 10px 14px;
            text-align: left; font-weight: 700; font-size: 11px;
            text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted);
            border-bottom: 1px solid var(--color-border);
        }
        thead th.th-note { text-align: center; }
        tbody tr { border-bottom: 1px solid var(--color-border); transition: background 0.1s; }
        tbody tr:last-child { border-bottom: 0; }
        tbody tr:hover td { background: var(--color-surface-alt) !important; }
        tbody td { padding: 9px 14px; color: var(--color-text); vertical-align: middle; }
        tbody td.td-note { text-align: center; }
        tbody tr.sn-row--vide td { background: #fef9c3; }
        .sn-matricule { font-family: monospace; color: var(--color-text-muted); font-size: 11px; }
        .sn-note-readonly {
            font-size: 15px; font-weight: 700; color: var(--color-primary);
            display: inline-block; min-width: 36px; text-align: center;
        }
        .sn-note-input { width: 80px; }
        .sn-empty {
            padding: 40px; text-align: center;
            color: var(--color-text-muted); font-size: 14px;
        }
        .sn-skeleton-row td { padding: 14px; }
        .sn-bottom-save {
            display: flex; justify-content: flex-end; align-items: center; gap: 12px;
            padding: 12px 16px;
            background: var(--color-surface-alt);
            border-top: 1px solid var(--color-border);
        }
        .sn-hint-save {
            font-size: 12px; color: var(--color-text-muted);
            display: flex; align-items: center; gap: 5px;
        }
        .sn-hint-save kbd {
            background: var(--color-surface); border: 1px solid var(--color-border);
            border-radius: 4px; padding: 1px 6px; font-size: 11px;
            font-family: monospace; color: var(--color-text);
        }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <h1>
            <i class="pi pi-pencil mr-2" style="color:var(--color-primary)"></i>
            {{ t('resultats.saisie.titre') }}
        </h1>
        <p class="sn-sub">{{ t('resultats.saisie.sousTitre') }}</p>

        <div class="sn-selecteur">
            <note-selecteur mode="saisie" (selectionChange)="onSelection($event)"></note-selecteur>
        </div>

        @if (loadError()) {
            <p-message severity="error" [text]="t('resultats.saisie.erreurChargement')"></p-message>
        }

        @if (selection(); as sel) {

            <!-- ── Barre contextuelle collante ── -->
            <div class="sn-sticky-bar">
                <div class="sn-context">
                    <span class="sn-ctx-chip">{{ sel.sequenceLibelle }}</span>
                    <i class="pi pi-angle-right sn-ctx-sep"></i>
                    <span class="sn-ctx-chip">{{ sel.classeLibelle }}</span>
                    <i class="pi pi-angle-right sn-ctx-sep"></i>
                    <span class="sn-ctx-chip">{{ sel.matiereLibelle }}</span>
                </div>
                <div class="sn-bar-right">
                    @if (isDirty()) {
                        <span class="sn-dirty-badge">{{ t('resultats.saisie.nonEnregistre') }}</span>
                    }
                    @if (saved() && !isDirty()) {
                        <span class="sn-save-ok">
                            <i class="pi pi-check"></i> {{ t('resultats.saisie.succes') }}
                        </span>
                    }
                    @if (saveError()) {
                        <span class="sn-save-err" [title]="saveError()!">{{ saveError() }}</span>
                    }
                    <p-button
                        [label]="t('resultats.saisie.enregistrer')"
                        icon="pi pi-save"
                        [loading]="saving()"
                        [disabled]="saving() || !isDirty()"
                        (onClick)="onSave()">
                    </p-button>
                </div>
            </div>

            <!-- ── Corps ── -->
            @if (loading()) {
                <div class="sn-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>{{ t('resultats.saisie.colMatricule') }}</th>
                                <th>{{ t('resultats.saisie.colNom') }}</th>
                                <th class="th-note">{{ t('resultats.saisie.colNote') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (i of [1,2,3,4,5]; track i) {
                                <tr class="sn-skeleton-row">
                                    <td><p-skeleton width="80px" height="14px"></p-skeleton></td>
                                    <td><p-skeleton width="160px" height="14px"></p-skeleton></td>
                                    <td><p-skeleton width="80px" height="30px"></p-skeleton></td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            } @else if (rows().length === 0) {
                <div class="sn-empty">{{ t('resultats.saisie.aucunEleve') }}</div>
            } @else {
                @if (hasNonSaisies()) {
                    <div class="sn-legende">
                        <span class="sn-legende-dot"></span>
                        {{ t('resultats.saisie.legendeNonSaisie') }}
                    </div>
                }
                <div class="sn-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>{{ t('resultats.saisie.colMatricule') }}</th>
                                <th>{{ t('resultats.saisie.colNom') }}</th>
                                <th class="th-note">{{ t('resultats.saisie.colNote') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (row of rows(); track row.eleveId) {
                                <tr [class.sn-row--vide]="row.statut !== 'VALIDEE' && isNoteNonSaisie(row.eleveId)">
                                    <td class="sn-matricule">{{ row.eleveMatricule }}</td>
                                    <td>{{ row.elevePrenom }} {{ row.eleveNom }}</td>
                                    <td class="td-note">
                                        @if (row.statut === 'VALIDEE') {
                                            <span class="sn-note-readonly">{{ row.valeur ?? '—' }}</span>
                                            <p-tag [value]="t('resultats.saisie.validee')" severity="success" styleClass="ml-2"></p-tag>
                                        } @else {
                                            <p-inputnumber
                                                class="sn-note-input"
                                                [ngModel]="noteValues[row.eleveId]"
                                                (ngModelChange)="onNoteChange(row.eleveId, $event)"
                                                [min]="0" [max]="20"
                                                [maxFractionDigits]="2"
                                                [useGrouping]="false"
                                                [placeholder]="'—'">
                                            </p-inputnumber>
                                        }
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                    @if (isDirty()) {
                        <div class="sn-bottom-save">
                            <span class="sn-hint-save">
                                <kbd>Ctrl</kbd>+<kbd>S</kbd>
                            </span>
                            <p-button
                                [label]="t('resultats.saisie.enregistrer')"
                                icon="pi pi-save"
                                [loading]="saving()"
                                [disabled]="saving()"
                                (onClick)="onSave()">
                            </p-button>
                        </div>
                    }
                </div>
            }
        }
    </ng-container>
    `
})
export class SaisieNotes implements OnInit {
    private resultatsService = inject(ResultatsService);

    readonly selection = signal<SelecteurResult | null>(null);
    readonly loading   = signal(false);
    readonly saving    = signal(false);
    readonly loadError = signal(false);
    readonly saveError = signal<string | null>(null);
    readonly saved     = signal(false);
    readonly isDirty   = signal(false);
    readonly rows      = signal<NoteResponse[]>([]);

    noteValues: Record<string, number | null> = {};

    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: BeforeUnloadEvent): void {
        if (this.isDirty()) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    @HostListener('document:keydown.control.s', ['$event'])
    @HostListener('document:keydown.meta.s', ['$event'])
    onCtrlS(event: Event): void {
        if (!this.isDirty() || this.saving()) return;
        event.preventDefault();
        this.onSave();
    }

    ngOnInit(): void {}

    onSelection(sel: SelecteurResult | null): void {
        this.selection.set(sel);
        this.saved.set(false);
        this.saveError.set(null);
        this.isDirty.set(false);
        if (!sel) { this.rows.set([]); return; }
        this.load(sel);
    }

    private load(sel: SelecteurResult): void {
        this.loading.set(true);
        this.loadError.set(false);
        this.resultatsService
            .getNotesByClasseMatiereSequence(sel.classeId, sel.matiereId, sel.sequenceId)
            .subscribe({
                next: notes => {
                    this.rows.set(notes);
                    this.noteValues = {};
                    for (const n of notes) {
                        this.noteValues[n.eleveId] = n.valeur; // null = pas encore saisi
                    }
                    this.isDirty.set(false);
                    this.loading.set(false);
                },
                error: () => {
                    this.loadError.set(true);
                    this.loading.set(false);
                }
            });
    }

    onNoteChange(eleveId: string, value: number | null): void {
        this.noteValues[eleveId] = value;
        this.isDirty.set(true);
        this.saved.set(false);
        this.saveError.set(null);
    }

    isNoteNonSaisie(eleveId: string): boolean {
        const v = this.noteValues[eleveId];
        return v === null || v === undefined;
    }

    hasNonSaisies(): boolean {
        return this.rows().some(r => r.statut !== 'VALIDEE' && this.isNoteNonSaisie(r.eleveId));
    }

    onSave(): void {
        const sel = this.selection();
        if (!sel) return;

        this.saving.set(true);
        this.saveError.set(null);
        this.saved.set(false);

        // N'envoyer que les notes explicitement saisies (valeur non nulle)
        const payload = this.rows()
            .filter(r => r.statut !== 'VALIDEE' && this.noteValues[r.eleveId] !== null && this.noteValues[r.eleveId] !== undefined)
            .map(r => ({ eleveId: r.eleveId, valeur: this.noteValues[r.eleveId] as number }));

        this.resultatsService.saisirEnLot({
            matiereId: sel.matiereId,
            sequenceId: sel.sequenceId,
            notes: payload
        }).subscribe({
            next: notes => {
                this.rows.set(notes);
                for (const n of notes) {
                    this.noteValues[n.eleveId] = n.valeur;
                }
                this.isDirty.set(false);
                this.saved.set(true);
                this.saving.set(false);
            },
            error: err => {
                this.saving.set(false);
                const msg = err?.error?.message;
                this.saveError.set(typeof msg === 'string' ? msg : 'Erreur lors de l\'enregistrement.');
            }
        });
    }
}
