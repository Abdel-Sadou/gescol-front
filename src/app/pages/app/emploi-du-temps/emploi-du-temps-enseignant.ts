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
import { PersonnelService } from '@/app/core/services/personnel.service';
import { AuthService } from '@/app/core/services/auth.service';
import { EdtGrille } from './edt-grille';

@Component({
    selector: 'app-emploi-du-temps-enseignant',
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
        .edt-toolbar__own-badge {
            font-size: 11px; font-weight: 600;
            background: var(--color-primary-soft); color: var(--color-primary);
            padding: 3px 10px; border-radius: 20px;
        }
        .edt-readonly-notice {
            display: flex; align-items: flex-start; gap: 10px;
            background: var(--color-surface-alt); border: 1px solid var(--color-border);
            border-radius: var(--radius-md); padding: 10px 14px;
            font-size: 13px; color: var(--color-text-muted);
            margin-bottom: 16px;
        }
        .edt-readonly-notice i { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
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
                    <i class="pi pi-user-edit mr-2" style="color:var(--color-primary)"></i>
                    {{ t('emploiDuTemps.titrePlanningEnseignant') }}
                </h1>

                @if (isOwnView()) {
                    <span class="edt-toolbar__own-badge">
                        <i class="pi pi-user" style="margin-right:4px"></i>
                        {{ t('emploiDuTemps.monPlanning') }}
                    </span>
                } @else {
                    <p-select
                        class="edt-toolbar__select"
                        [ngModel]="selectedEnseignantId()"
                        (ngModelChange)="onEnseignantChange($event)"
                        [options]="enseignantOptions()"
                        optionLabel="label" optionValue="value"
                        [showClear]="true"
                        [filter]="true"
                        [placeholder]="t('emploiDuTemps.selectionnerEnseignant')"
                        [loading]="enseignantsLoading()">
                    </p-select>
                }

                <div class="edt-toolbar__spacer"></div>
                @if (canModify() && selectedEnseignantId()) {
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

            @if (isOwnView()) {
                <div class="edt-readonly-notice">
                    <i class="pi pi-info-circle"></i>
                    <span>{{ t('emploiDuTemps.enseignantReadonlyNotice') }}</span>
                </div>
            }

            @if (!selectedEnseignantId()) {
                <div class="edt-empty">
                    <i class="pi pi-user" style="font-size:2.5rem;color:var(--color-border-field);margin-bottom:12px;display:block"></i>
                    {{ t('emploiDuTemps.choisirEnseignantPourAfficher') }}
                </div>
            } @else if (loading()) {
                <div class="edt-loading"><i class="pi pi-spinner pi-spin"></i></div>
            } @else if (error()) {
                <p-message severity="error" [text]="t('emploiDuTemps.erreurChargement')"></p-message>
            } @else {
                <edt-grille
                    [creneaux]="creneaux()"
                    mode="enseignant"
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
export class EmploiDuTempsEnseignant implements OnInit {
    protected router       = inject(Router);
    private   route        = inject(ActivatedRoute);
    private   edtService   = inject(EmploiDuTempsService);
    private   personnelSvc = inject(PersonnelService);
    private   authService  = inject(AuthService);
    private   transloco    = inject(TranslocoService);

    readonly enseignantsLoading   = signal(false);
    readonly loading              = signal(false);
    readonly error                = signal(false);
    readonly enseignantOptions    = signal<{ label: string; value: string }[]>([]);
    readonly selectedEnseignantId = signal<string | null>(null);
    readonly creneaux             = signal<EmploiDuTempsResponse[]>([]);

    readonly successMsg          = signal<string | null>(null);
    readonly deleteLoading       = signal(false);
    readonly deleteError         = signal<string | null>(null);
    readonly deleteTarget        = signal<EmploiDuTempsResponse | null>(null);
    readonly deleteDialogVisible = signal(false);

    readonly isOwnView = computed(() => this.authService.role() === 'ENSEIGNANT');
    readonly canModify  = computed(() => {
        const r = this.authService.role();
        return r === 'SUPER_ADMIN' || r === 'SECRETARIAT';
    });

    ngOnInit(): void {
        const s = history.state;
        if (s?.success === 'creneauCree') {
            this.successMsg.set(this.transloco.translate('app.emploiDuTemps.successCreneauCree'));
            setTimeout(() => this.successMsg.set(null), 4000);
        }
        const user = this.authService.currentUser();

        if (this.isOwnView() && user?.personnelId) {
            this.selectedEnseignantId.set(user.personnelId);
            this.loadPlanning(user.personnelId);
        } else {
            this.loadEnseignants();
            const id = this.route.snapshot.queryParamMap.get('enseignantId');
            if (id) { this.selectedEnseignantId.set(id); this.loadPlanning(id); }
        }
    }

    private loadEnseignants(): void {
        this.enseignantsLoading.set(true);
        this.personnelSvc.rechercher({ typePersonnel: 'ENSEIGNANT' }, 0, 200, 'nom,asc').subscribe({
            next: res => {
                this.enseignantOptions.set(
                    res.content.map(p => ({
                        label: `${p.prenom} ${p.nom}`,
                        value: p.id
                    }))
                );
                this.enseignantsLoading.set(false);
            },
            error: () => this.enseignantsLoading.set(false)
        });
    }

    onEnseignantChange(id: string | null): void {
        this.selectedEnseignantId.set(id);
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: id ? { enseignantId: id } : {},
            replaceUrl: true
        });
        if (id) this.loadPlanning(id);
        else this.creneaux.set([]);
    }

    private loadPlanning(enseignantId: string): void {
        this.loading.set(true);
        this.error.set(false);
        this.edtService.getByEnseignant(enseignantId).subscribe({
            next:  data => { this.creneaux.set(data); this.loading.set(false); },
            error: ()   => { this.error.set(true); this.loading.set(false); }
        });
    }

    goToNouveauCreneau(): void {
        this.router.navigate(['/app/emploi-du-temps/nouveau'], {
            queryParams: { enseignantId: this.selectedEnseignantId() }
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
                const id = this.selectedEnseignantId();
                if (id) this.loadPlanning(id);
            },
            error: (err) => {
                this.deleteLoading.set(false);
                const msg = err?.error?.message;
                this.deleteError.set(typeof msg === 'string' ? msg : 'Une erreur est survenue.');
            }
        });
    }
}
