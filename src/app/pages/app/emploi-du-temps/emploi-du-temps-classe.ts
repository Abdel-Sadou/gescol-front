import {
    ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { EmploiDuTempsService, EmploiDuTempsResponse } from '@/app/core/services/emploi-du-temps.service';
import { ParametrageService } from '@/app/core/services/parametrage.service';
import { AuthService } from '@/app/core/services/auth.service';
import { EdtGrille } from './edt-grille';

@Component({
    selector: 'app-emploi-du-temps-classe',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, SelectModule, MessageModule, DialogModule,
        EdtGrille
    ],
    styles: [`
        .edt-toolbar {
            display: flex; align-items: center; gap: 12px;
            margin-bottom: 16px; flex-wrap: wrap;
        }
        .edt-toolbar__title {
            font-family: var(--font-serif); font-size: 20px; font-weight: 700;
            color: var(--color-text); margin: 0; flex: 0 0 auto;
        }
        .edt-toolbar__select { flex: 0 0 280px; min-width: 200px; }
        .edt-toolbar__spacer { flex: 1 1 0; }
        .edt-context {
            display: flex; align-items: center; gap: 8px;
            font-size: 13px; font-weight: 600; color: var(--color-text);
            margin-bottom: 16px;
            padding: 8px 12px;
            background: var(--color-primary-soft);
            border-left: 3px solid var(--color-primary);
            border-radius: 0 var(--radius-md) var(--radius-md) 0;
        }
        .edt-context i { color: var(--color-primary); font-size: 14px; }
        .edt-empty {
            text-align: center; padding: 48px 24px;
            color: var(--color-text-muted); font-size: 14px;
        }
        .edt-loading {
            text-align: center; padding: 48px 24px; color: var(--color-primary);
            font-size: 24px;
        }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <!-- Toolbar -->
            <div class="edt-toolbar">
                <h1 class="edt-toolbar__title">
                    <i class="pi pi-calendar mr-2" style="color:var(--color-primary)"></i>
                    {{ t('emploiDuTemps.titrePlanningClasse') }}
                </h1>
                <p-select
                    class="edt-toolbar__select"
                    [ngModel]="selectedClasseId()"
                    (ngModelChange)="onClasseChange($event)"
                    [options]="classeOptions()"
                    optionLabel="label" optionValue="value"
                    [showClear]="true"
                    [filter]="true"
                    [placeholder]="t('emploiDuTemps.selectionnerClasse')"
                    [loading]="classesLoading()">
                </p-select>
                <div class="edt-toolbar__spacer"></div>
                @if (canModify() && selectedClasseId()) {
                    <button pButton icon="pi pi-plus"
                        [label]="t('emploiDuTemps.nouveauCreneau')"
                        class="p-button-success"
                        (click)="goToNouveauCreneau()">
                    </button>
                }
            </div>

            @if (successMsg()) {
                <p-message severity="success" [text]="successMsg()!" class="mb-3 block"></p-message>
            }

            @if (selectedClasseLabel()) {
                <div class="edt-context">
                    <i class="pi pi-bookmark"></i>
                    {{ selectedClasseLabel() }}
                </div>
            }

            @if (!selectedClasseId()) {
                <div class="edt-empty">
                    <i class="pi pi-calendar" style="font-size:2.5rem;color:var(--color-border-field);margin-bottom:12px;display:block"></i>
                    {{ t('emploiDuTemps.choisirClassePourAfficher') }}
                </div>
            } @else if (loading()) {
                <div class="edt-loading"><i class="pi pi-spinner pi-spin"></i></div>
            } @else if (error()) {
                <p-message severity="error" [text]="t('emploiDuTemps.erreurChargement')"></p-message>
            } @else {
                <edt-grille
                    [creneaux]="creneaux()"
                    mode="classe"
                    [canModify]="canModify()"
                    (deleteCreneau)="onDeleteRequest($event)">
                </edt-grille>
            }
        </div>

        <!-- Dialog suppression -->
        <p-dialog
            [visible]="deleteDialogVisible()"
            (visibleChange)="onDeleteDialogChange($event)"
            [modal]="true"
            [closable]="!deleteLoading()"
            [style]="{ width: '400px' }"
            [header]="t('emploiDuTemps.supprimerCreneauTitre')"
        >
            @if (deleteTarget()) {
                <p class="m-0" style="color:var(--color-text-body)">
                    {{ t('emploiDuTemps.supprimerCreneauConfirm',
                        { matiere: deleteTarget()!.matiereLibelle,
                          jour: t('emploiDuTemps.jours.' + deleteTarget()!.jourSemaine) }) }}
                </p>
            }
            @if (deleteError()) {
                <p class="text-sm mt-3" style="color:var(--color-danger)">{{ deleteError() }}</p>
            }
            <ng-template #footer>
                <button pButton [label]="t('emploiDuTemps.annuler')"
                    class="p-button-outlined p-button-secondary"
                    [disabled]="deleteLoading()"
                    (click)="deleteDialogVisible.set(false); deleteError.set(null)">
                </button>
                <button pButton [label]="t('emploiDuTemps.supprimer')"
                    class="p-button-danger"
                    [loading]="deleteLoading()"
                    (click)="confirmDelete()">
                </button>
            </ng-template>
        </p-dialog>
    </ng-container>
    `
})
export class EmploiDuTempsClasse implements OnInit {
    protected router         = inject(Router);
    private   route          = inject(ActivatedRoute);
    private   edtService     = inject(EmploiDuTempsService);
    private   paramService   = inject(ParametrageService);
    private   authService    = inject(AuthService);
    private   transloco      = inject(TranslocoService);

    readonly classesLoading   = signal(false);
    readonly loading          = signal(false);
    readonly error            = signal(false);
    readonly classeOptions    = signal<{ label: string; value: string }[]>([]);
    readonly selectedClasseId = signal<string | null>(null);
    readonly creneaux         = signal<EmploiDuTempsResponse[]>([]);

    readonly successMsg         = signal<string | null>(null);
    readonly deleteLoading      = signal(false);
    readonly deleteError        = signal<string | null>(null);
    readonly deleteTarget       = signal<EmploiDuTempsResponse | null>(null);
    readonly deleteDialogVisible = signal(false);

    readonly canModify = computed(() => {
        const r = this.authService.role();
        return r === 'SUPER_ADMIN' || r === 'SECRETARIAT';
    });

    readonly selectedClasseLabel = computed(() => {
        const id = this.selectedClasseId();
        if (!id) return null;
        return this.classeOptions().find(c => c.value === id)?.label ?? null;
    });

    ngOnInit(): void {
        this.loadClasses();
        const id = this.route.snapshot.queryParamMap.get('classeId');
        if (id) { this.selectedClasseId.set(id); this.loadPlanning(id); }
        const s = history.state;
        if (s?.success === 'creneauCree') {
            this.successMsg.set(this.transloco.translate('app.emploiDuTemps.successCreneauCree'));
            setTimeout(() => this.successMsg.set(null), 4000);
        }
    }

    private loadClasses(): void {
        this.classesLoading.set(true);
        this.paramService.getClasses(0, 200).subscribe({
            next: res => {
                this.classeOptions.set(
                    res.content.map(c => ({
                        label: `${c.libelle}${c.anneeScolaire ? ' (' + c.anneeScolaire + ')' : ''}`,
                        value: c.id
                    }))
                );
                this.classesLoading.set(false);
            },
            error: () => this.classesLoading.set(false)
        });
    }

    onClasseChange(id: string | null): void {
        this.selectedClasseId.set(id);
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: id ? { classeId: id } : {},
            replaceUrl: true
        });
        if (id) this.loadPlanning(id);
        else this.creneaux.set([]);
    }

    goToNouveauCreneau(): void {
        this.router.navigate(['/app/emploi-du-temps/nouveau'], {
            queryParams: { classeId: this.selectedClasseId() }
        });
    }

    private loadPlanning(classeId: string): void {
        this.loading.set(true);
        this.error.set(false);
        this.edtService.getByClasse(classeId).subscribe({
            next:  data => { this.creneaux.set(data); this.loading.set(false); },
            error: ()   => { this.error.set(true); this.loading.set(false); }
        });
    }

    onDeleteRequest(cr: EmploiDuTempsResponse): void {
        this.deleteTarget.set(cr);
        this.deleteError.set(null);
        this.deleteDialogVisible.set(true);
    }

    onDeleteDialogChange(visible: boolean): void {
        if (!visible && !this.deleteLoading()) this.deleteDialogVisible.set(false);
    }

    confirmDelete(): void {
        const cr = this.deleteTarget();
        if (!cr) return;
        this.deleteLoading.set(true);
        this.edtService.supprimerCreneau(cr.id).subscribe({
            next: () => {
                this.deleteLoading.set(false);
                this.deleteDialogVisible.set(false);
                const classeId = this.selectedClasseId();
                if (classeId) this.loadPlanning(classeId);
            },
            error: (err) => {
                this.deleteLoading.set(false);
                const msg = err?.error?.message;
                this.deleteError.set(typeof msg === 'string' ? msg : 'Une erreur est survenue.');
            }
        });
    }
}
