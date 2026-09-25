import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';
import { DeleteConfirmDialogComponent } from '@/app/shared/components/delete-confirm-dialog.component';
import { PersonnelService, PersonnelResponse, PersonnelSearchParams } from '@/app/core/services/personnel.service';
import { UtilisateurService, RoleStaff } from '@/app/core/services/utilisateur.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PageResponse } from '@/app/core/services/eleve.service';

const ROLES_STAFF: RoleStaff[] = ['SUPER_ADMIN', 'SECRETARIAT', 'ECONOMAT', 'ENSEIGNANT', 'COMMUNICATION'];

@Component({
    selector: 'app-personnel-liste',
    standalone: true,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, InputTextModule, SelectModule, MultiSelectModule, DialogModule, MessageModule,
        GescolTableComponent, DeleteConfirmDialogComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">
            <!-- En-tête -->
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">
                    <i class="pi pi-users mr-2" style="color:var(--color-primary)"></i>
                    {{ t('personnel.titre') }}
                </h2>
                @if (canModify()) {
                    <button pButton icon="pi pi-plus" [label]="t('personnel.nouveau')"
                        class="p-button-success"
                        (click)="router.navigate(['/app/personnel/nouveau'])"></button>
                }
            </div>
            @if (successMsg()) {
                <p-message severity="success" [text]="successMsg()!" class="mb-3 block"></p-message>
            }

            <!-- Filtres -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <input pInputText type="text"
                    [(ngModel)]="filters.nom"
                    [placeholder]="t('personnel.filtres.nom')" />
                <input pInputText type="text"
                    [(ngModel)]="filters.matricule"
                    [placeholder]="t('personnel.filtres.matricule')" />
                <p-select
                    [(ngModel)]="filters.typePersonnel"
                    [options]="typePersonnelOptions(t)"
                    optionLabel="label" optionValue="value"
                    [showClear]="true"
                    [placeholder]="t('personnel.filtres.tousTypes')">
                </p-select>
            </div>
            <div class="flex gap-2 mb-5">
                <button pButton icon="pi pi-search" [label]="t('personnel.filtres.rechercher')"
                    (click)="onSearch()"></button>
                <button pButton icon="pi pi-times" [label]="t('personnel.filtres.reinitialiser')"
                    class="p-button-outlined p-button-secondary"
                    (click)="onReset()"></button>
            </div>

            <!-- Table -->
            <gescol-table
                #tableRef
                [columns]="columns(t)"
                [data]="data()"
                [showView]="false"
                [showEdit]="canModify()"
                [showDelete]="canModify()"
                [showToggleActive]="canModify()"
                [tooltipDeactivate]="t('personnel.desactiver')"
                [tooltipReactivate]="t('personnel.reactiver')"
                [showCustomAction]="isSuperAdmin()"
                [iconCustomAction]="'pi pi-user-plus'"
                [tooltipCustomAction]="t('comptes.creerDepuisPersonnel')"
                [customActionCondition]="creerCompteCondition"
                (load)="onLoad($event)"
                (edit)="onEdit($event)"
                (delete)="onDeleteRequest($event)"
                (toggleActive)="onToggleActif($event)"
                (customAction)="onCreerCompte($event)"
            ></gescol-table>
        </div>

        <!-- Dialog suppression (R10 : le 409 backend s'affiche automatiquement) -->
        <gescol-delete-confirm-dialog
            [(visible)]="deleteVisible"
            [itemLabel]="deleteLabel"
            [deleteFn]="deleteFn"
            (deleted)="onDeleted()"
        ></gescol-delete-confirm-dialog>

        <!-- ══ DIALOG : CRÉER UN COMPTE depuis Personnel ═══════════════════ -->
        @if (creerCompteTarget()) {
            <p-dialog
                [(visible)]="creerCompteVisible"
                [modal]="true"
                [closable]="!creerLoading()"
                [style]="{ width: '460px' }"
                [header]="t('comptes.creerDepuisPersonnel') + ' — ' + creerCompteNomComplet()">

                <div class="flex flex-col gap-4 pt-2">
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">{{ t('comptes.creer.email') }} *</label>
                        <input pInputText type="email" autocomplete="off"
                            [(ngModel)]="creerEmail"
                            [placeholder]="t('comptes.creer.email')">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">{{ t('comptes.creer.roles') }} *</label>
                        <p-multiselect
                            [(ngModel)]="creerRoles"
                            [options]="roleOptions(t)"
                            optionLabel="label" optionValue="value"
                            [placeholder]="t('comptes.creer.rolesPlaceholder')"
                            [appendTo]="'body'"
                            styleClass="w-full">
                        </p-multiselect>
                        @if (creerCompteTarget()!.typePersonnel !== 'ENSEIGNANT') {
                            <small style="color:var(--color-text-muted)">{{ t('comptes.creer.roleObligatoire') }}</small>
                        }
                    </div>
                    @if (creerError()) {
                        <p-message severity="error" [text]="creerError()"></p-message>
                    }
                </div>
                <ng-template #footer>
                    <button pButton [label]="t('deleteDialog.annuler')"
                        class="p-button-outlined p-button-secondary"
                        [disabled]="creerLoading()"
                        (click)="closeCreerCompte()">
                    </button>
                    <button pButton
                        [label]="creerLoading() ? t('comptes.creer.creation') : t('comptes.creer.confirmer')"
                        class="p-button-success"
                        [loading]="creerLoading()"
                        (click)="confirmCreerCompte()">
                    </button>
                </ng-template>
            </p-dialog>
        }

        <!-- ══ DIALOG : MOT DE PASSE TEMPORAIRE (affiché une seule fois) ════ -->
        <p-dialog
            [(visible)]="passwordDialogVisible"
            [modal]="true"
            [closable]="false"
            [style]="{ width: '480px' }"
            [header]="t('comptes.motDePasseTemporaire.titre')">

            <div class="flex flex-col gap-4 pt-2">
                <div style="background:#FFF8E1; border:1px solid #FFD54F; border-radius:6px; padding:12px 14px; display:flex; gap:10px; align-items:flex-start;">
                    <i class="pi pi-exclamation-triangle mt-0.5" style="color:#F57F17; flex-shrink:0;"></i>
                    <p class="m-0 text-sm" style="line-height:1.6; color:#5D4037;">{{ t('comptes.motDePasseTemporaire.avertissement') }}</p>
                </div>
                <div style="background:var(--color-surface-sunken); border-radius:6px; padding:14px 16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                    <code style="font-size:18px; font-weight:700; letter-spacing:0.08em; color:var(--color-text); flex:1; word-break:break-all;">{{ tempPassword() }}</code>
                    <button pButton
                        [icon]="copied() ? 'pi pi-check' : 'pi pi-copy'"
                        [label]="copied() ? t('comptes.motDePasseTemporaire.copie') : t('comptes.motDePasseTemporaire.copier')"
                        [class]="copied() ? 'p-button-success p-button-sm' : 'p-button-outlined p-button-sm'"
                        (click)="copyPassword()">
                    </button>
                </div>
            </div>
            <ng-template #footer>
                <button pButton
                    [label]="t('comptes.motDePasseTemporaire.confirmer')"
                    class="p-button-success w-full"
                    (click)="closePasswordDialog()">
                </button>
            </ng-template>
        </p-dialog>

        <!-- Dialog désactiver / réactiver -->
        @if (toggleTarget()) {
            <p-dialog
                [(visible)]="toggleDialogVisible"
                [modal]="true"
                [closable]="!toggleLoading()"
                [style]="{ width: '420px' }"
                [header]="toggleTarget()!.actif
                    ? t('personnel.desactiverConfirm.titre')
                    : t('personnel.reactiverConfirm.titre')"
            >
                <p class="m-0" style="color: var(--color-text-body)">
                    @if (toggleTarget()!.actif) {
                        {{ t('personnel.desactiverConfirm.message',
                            { prenom: toggleTarget()!.prenom, nom: toggleTarget()!.nom }) }}
                    } @else {
                        {{ t('personnel.reactiverConfirm.message',
                            { prenom: toggleTarget()!.prenom, nom: toggleTarget()!.nom }) }}
                    }
                </p>
                @if (toggleError()) {
                    <p class="text-sm mt-3" style="color: var(--color-danger)">{{ toggleError() }}</p>
                }
                <ng-template #footer>
                    <button pButton
                        [label]="t('personnel.desactiverConfirm.annuler')"
                        class="p-button-outlined p-button-secondary"
                        [disabled]="toggleLoading()"
                        (click)="toggleDialogVisible = false; toggleError.set(null)">
                    </button>
                    <button pButton
                        [label]="toggleTarget()!.actif
                            ? t('personnel.desactiverConfirm.confirmer')
                            : t('personnel.reactiverConfirm.confirmer')"
                        [class]="toggleTarget()!.actif ? 'p-button-warning' : 'p-button-success'"
                        [loading]="toggleLoading()"
                        (click)="confirmToggle()">
                    </button>
                </ng-template>
            </p-dialog>
        }
    </ng-container>
    `
})
export class PersonnelListe implements OnInit {
    protected router              = inject(Router);
    private  personnelService     = inject(PersonnelService);
    private  utilisateurService   = inject(UtilisateurService);
    private  authService          = inject(AuthService);
    private  transloco            = inject(TranslocoService);

    @ViewChild('tableRef') tableRef!: GescolTableComponent;

    readonly data       = signal<PageResponse<PersonnelResponse> | 'error' | undefined>(undefined);
    readonly successMsg = signal<string | null>(null);

    filters: PersonnelSearchParams = {};
    private pendingFilters: PersonnelSearchParams = {};

    readonly canModify = computed(() => {
        const r = this.authService.role();
        return r === 'SUPER_ADMIN' || r === 'SECRETARIAT';
    });

    readonly isSuperAdmin = computed(() => this.authService.role() === 'SUPER_ADMIN');

    // Set des personnelId déjà liés à un compte (chargé une fois si SUPER_ADMIN).
    readonly linkedPersonnelIds = signal<Set<string>>(new Set());

    // Condition arrow capturée pour éviter le re-bind à chaque render.
    readonly creerCompteCondition = (row: PersonnelResponse): boolean =>
        !this.linkedPersonnelIds().has(row.id);

    readonly creerCompteNomComplet = computed(() => {
        const p = this.creerCompteTarget();
        if (!p) return '';
        return p.prenom ? `${p.prenom} ${p.nom}` : p.nom;
    });

    // ── Créer compte depuis personnel ─────────────────────────────────────────
    readonly creerCompteTarget = signal<PersonnelResponse | null>(null);
    readonly creerLoading      = signal(false);
    readonly creerError        = signal('');
    creerCompteVisible         = false;
    creerEmail                 = '';
    creerRoles: RoleStaff[]    = [];

    // Mot de passe temporaire — vidé dès la fermeture du dialog, jamais logué.
    readonly tempPassword       = signal('');
    readonly copied             = signal(false);
    passwordDialogVisible       = false;

    ngOnInit(): void {
        const s = history.state;
        if (s?.success === 'cree' || s?.success === 'modifie') {
            const key = s.success === 'cree' ? 'personnel.successCree' : 'personnel.successModifie';
            this.successMsg.set(this.transloco.translate('app.' + key));
            setTimeout(() => this.successMsg.set(null), 4000);
        }
        if (this.isSuperAdmin()) {
            this.loadLinkedPersonnelIds();
        }
    }

    private loadLinkedPersonnelIds(): void {
        this.utilisateurService.lister({}, 0, 500).subscribe({
            next: (res) => {
                const ids = new Set<string>(
                    res.content
                        .filter(u => u.personnelId !== null)
                        .map(u => u.personnelId as string)
                );
                this.linkedPersonnelIds.set(ids);
            }
        });
    }

    // ── Désactiver / Réactiver ────────────────────────────────────────────────
    readonly toggleTarget  = signal<PersonnelResponse | null>(null);
    readonly toggleLoading = signal(false);
    readonly toggleError   = signal<string | null>(null);
    toggleDialogVisible    = false;

    // ── Suppression ───────────────────────────────────────────────────────────
    deleteVisible = false;
    deleteLabel   = '';
    deleteFn: () => any = () => { throw new Error('deleteFn not set'); };

    typePersonnelOptions(t: (k: string) => string) {
        return [
            { label: t('personnel.typePersonnel.ENSEIGNANT'),     value: 'ENSEIGNANT'     },
            { label: t('personnel.typePersonnel.NON_ENSEIGNANT'), value: 'NON_ENSEIGNANT' }
        ];
    }

    columns(t: (k: string) => string): ColDef[] {
        return [
            { field: 'matricule',     header: t('personnel.colonnes.matricule'),     width: '130px' },
            { field: 'nom',           header: t('personnel.colonnes.nom'),            sortable: true },
            { field: 'prenom',        header: t('personnel.colonnes.prenom') },
            { field: 'typePersonnel', header: t('personnel.colonnes.typePersonnel'),  width: '140px' },
            { field: 'typeContrat',   header: t('personnel.colonnes.typeContrat'),    width: '150px' },
            {
                field: 'actif', header: t('personnel.colonnes.statut'), width: '100px',
                boolean: true,
                booleanTrueLabel:  t('personnel.statut.actif'),
                booleanFalseLabel: t('personnel.statut.inactif')
            }
        ];
    }

    onLoad(event: GescolLoadEvent): void {
        this.loadData(event.page, event.size, event.sort);
    }

    onSearch(): void {
        this.pendingFilters = { ...this.filters };
        this.tableRef?.resetPage();
    }

    onReset(): void {
        this.filters = {};
        this.pendingFilters = {};
        this.tableRef?.resetPage();
    }

    onEdit(row: PersonnelResponse): void {
        this.router.navigate(['/app/personnel', row.id, 'editer']);
    }

    onToggleActif(row: PersonnelResponse): void {
        this.toggleTarget.set(row);
        this.toggleError.set(null);
        this.toggleDialogVisible = true;
    }

    confirmToggle(): void {
        const target = this.toggleTarget();
        if (!target) return;
        this.toggleLoading.set(true);
        this.toggleError.set(null);

        const obs = target.actif
            ? this.personnelService.desactiver(target.id)
            : this.personnelService.reactiver(target.id);

        obs.subscribe({
            next: () => {
                this.toggleLoading.set(false);
                this.toggleDialogVisible = false;
                this.tableRef?.resetPage();
            },
            error: (err) => {
                this.toggleLoading.set(false);
                const msg = err?.error?.message ?? null;
                this.toggleError.set(typeof msg === 'string' ? msg : 'Une erreur est survenue.');
            }
        });
    }

    onDeleteRequest(row: PersonnelResponse): void {
        this.deleteLabel = `${row.prenom} ${row.nom}`;
        this.deleteFn    = () => this.personnelService.supprimer(row.id);
        this.deleteVisible = true;
    }

    onDeleted(): void {
        this.deleteVisible = false;
        this.tableRef?.resetPage();
    }

    roleOptions(t: (k: string) => string) {
        return ROLES_STAFF.map(r => ({ label: t(`comptes.roles.${r}`), value: r }));
    }

    onCreerCompte(row: PersonnelResponse): void {
        this.creerCompteTarget.set(row);
        this.creerEmail  = '';
        // Pré-sélection ENSEIGNANT si le personnel est enseignant — sinon choix explicite obligatoire.
        this.creerRoles  = row.typePersonnel === 'ENSEIGNANT' ? ['ENSEIGNANT'] : [];
        this.creerError.set('');
        this.creerCompteVisible = true;
    }

    closeCreerCompte(): void {
        this.creerCompteVisible = false;
        this.creerError.set('');
    }

    confirmCreerCompte(): void {
        const personnel = this.creerCompteTarget();
        if (!personnel) return;
        if (!this.creerEmail.trim() || this.creerRoles.length === 0) {
            this.creerError.set(this.transloco.translate('deleteDialog.erreurGenerale'));
            return;
        }
        this.creerLoading.set(true);
        this.creerError.set('');
        this.utilisateurService.creer({
            email:       this.creerEmail.trim(),
            nom:         personnel.nom,
            prenom:      personnel.prenom ?? undefined,
            roles:       this.creerRoles,
            personnelId: personnel.id
        }).subscribe({
            next: (res) => {
                this.creerLoading.set(false);
                this.creerCompteVisible = false;
                // Mettre à jour le set localement — évite un rechargement réseau.
                const next = new Set(this.linkedPersonnelIds());
                next.add(personnel.id);
                this.linkedPersonnelIds.set(next);
                // Afficher le mot de passe temporaire une seule fois.
                this.tempPassword.set(res.motDePasseTemporaire);
                this.passwordDialogVisible = true;
            },
            error: (err) => {
                this.creerLoading.set(false);
                this.creerError.set(err?.error?.message ?? this.transloco.translate('deleteDialog.erreurGenerale'));
            }
        });
    }

    copyPassword(): void {
        navigator.clipboard.writeText(this.tempPassword()).then(() => {
            this.copied.set(true);
            setTimeout(() => this.copied.set(false), 2000);
        });
    }

    closePasswordDialog(): void {
        this.passwordDialogVisible = false;
        this.tempPassword.set(''); // Vidé immédiatement — jamais conservé.
        this.copied.set(false);
    }

    private loadData(page: number, size: number, sort: string): void {
        this.data.set(undefined);
        this.personnelService.rechercher(this.pendingFilters, page, size, sort).subscribe({
            next:  res => this.data.set(res),
            error: ()  => this.data.set('error')
        });
    }
}
