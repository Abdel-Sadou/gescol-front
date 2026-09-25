import { Component, computed, inject, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { GescolTableComponent, ColDef, GescolLoadEvent } from '@/app/shared/components/gescol-table.component';
import {
    UtilisateurService,
    UtilisateurResponse,
    RoleStaff
} from '@/app/core/services/utilisateur.service';
import { PersonnelService, PersonnelResponse } from '@/app/core/services/personnel.service';
import { PageResponse } from '@/app/core/services/eleve.service';
import { LanguageService } from '@/app/core/services/language.service';

type DialogType = 'creer' | 'roles' | 'reinit' | 'toggle' | null;
type ToggleAction = 'desactiver' | 'reactiver';

const ROLES_STAFF: RoleStaff[] = [
    'SUPER_ADMIN', 'SECRETARIAT', 'ECONOMAT', 'ENSEIGNANT', 'COMMUNICATION'
];

interface PersonnelItem {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    email: string | null;
    displayLabel: string;
}

@Component({
    selector: 'app-comptes-liste',
    standalone: true,
    imports: [
        FormsModule, TranslocoDirective,
        ButtonModule, InputTextModule, SelectModule, MultiSelectModule,
        DialogModule, MessageModule, TagModule, AutoCompleteModule,
        GescolTableComponent
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">

            <!-- En-tête -->
            <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">
                    <i class="pi pi-lock mr-2" style="color:var(--color-primary)"></i>
                    {{ t('comptes.titre') }}
                </h2>
                <button pButton icon="pi pi-plus" [label]="t('comptes.nouveau')"
                    class="p-button-success"
                    (click)="openCreer(null)">
                </button>
            </div>

            @if (successMsg()) {
                <p-message severity="success" [text]="successMsg()!" class="mb-3 block"></p-message>
            }

            <!-- Filtres -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <p-select
                    [(ngModel)]="filterRoleValue"
                    [options]="roleOptions(t)"
                    optionLabel="label" optionValue="value"
                    [showClear]="true"
                    [placeholder]="t('comptes.filtres.tousRoles')">
                </p-select>
                <p-select
                    [(ngModel)]="filterActifValue"
                    [options]="actifOptions(t)"
                    optionLabel="label" optionValue="value"
                    [showClear]="true"
                    [placeholder]="t('comptes.filtres.tousStatuts')">
                </p-select>
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
                [showEdit]="false"
                [showDelete]="false"
                [showView]="true"
                [iconView]="'pi pi-shield'"
                [tooltipView]="t('comptes.actions.modifierRoles')"
                [showToggleActive]="true"
                [tooltipDeactivate]="t('comptes.actions.desactiver')"
                [tooltipReactivate]="t('comptes.actions.reactiver')"
                [showCustomAction]="true"
                [iconCustomAction]="'pi pi-lock'"
                [tooltipCustomAction]="t('comptes.actions.reinitialiserMdp')"
                [customActionSeverity]="'p-button-text p-button-sm p-button-warning'"
                (load)="onLoad($event)"
                (view)="openModifierRoles($event)"
                (toggleActive)="openToggle($event)"
                (customAction)="openReinit($event)"
            ></gescol-table>
        </div>

        <!-- ══ DIALOG : CRÉER UN COMPTE ══════════════════════════════════════ -->
        <p-dialog
            [(visible)]="dialogVisible"
            [modal]="true"
            [closable]="!actionLoading()"
            [style]="{ width: '480px' }"
            [header]="t('comptes.creer.titre')"
            (onHide)="onDialogHide()">

            @if (activeDialog() === 'creer') {
                <div class="flex flex-col gap-4 pt-2">

                    <!-- Lier à un Personnel -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">{{ t('comptes.creer.personnel') }}</label>
                        <p-autocomplete
                            [(ngModel)]="draftPersonnel"
                            [suggestions]="filteredPersonnel()"
                            [optionLabel]="'displayLabel'"
                            [forceSelection]="true"
                            [showClear]="true"
                            [dropdown]="true"
                            [emptyMessage]="t('comptes.creer.personnelAucun')"
                            [placeholder]="t('comptes.creer.personnelPlaceholder')"
                            (completeMethod)="filterPersonnel($event)"
                            (onSelect)="onPersonnelSelect($event)"
                            (onClear)="onPersonnelClear()"
                            [appendTo]="'body'"
                            styleClass="w-full">
                            <ng-template #item let-p>
                                <div class="flex flex-col">
                                    <span class="font-semibold text-sm">{{ p.nom }} {{ p.prenom }}</span>
                                    <span class="text-xs" style="color:var(--color-text-muted)">{{ p.matricule }}</span>
                                </div>
                            </ng-template>
                        </p-autocomplete>
                        @if (draftRoles.includes('ENSEIGNANT') && !draftPersonnel) {
                            <small class="text-red-500">{{ t('comptes.creer.erreurEnseignantPersonnel') }}</small>
                        }
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">
                            {{ t('comptes.creer.email') }} *
                        </label>
                        <input pInputText type="email" autocomplete="off"
                            [(ngModel)]="draftEmail"
                            [placeholder]="t('comptes.creer.email')">
                    </div>
                    <div class="flex gap-3">
                        <div class="flex flex-col gap-1 flex-1">
                            <label class="text-sm font-semibold">
                                {{ t('comptes.creer.nom') }}
                                @if (!draftPersonnel) { <span>*</span> }
                            </label>
                            <input pInputText type="text"
                                [(ngModel)]="draftNom"
                                [placeholder]="t('comptes.creer.nom')">
                        </div>
                        <div class="flex flex-col gap-1 flex-1">
                            <label class="text-sm font-semibold">{{ t('comptes.creer.prenom') }}</label>
                            <input pInputText type="text"
                                [(ngModel)]="draftPrenom"
                                [placeholder]="t('comptes.creer.prenom')">
                        </div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">{{ t('comptes.creer.roles') }} *</label>
                        <p-multiselect
                            [(ngModel)]="draftRoles"
                            [options]="roleOptions(t)"
                            optionLabel="label" optionValue="value"
                            [placeholder]="t('comptes.creer.rolesPlaceholder')"
                            [appendTo]="'body'"
                            styleClass="w-full">
                        </p-multiselect>
                    </div>
                    @if (actionError()) {
                        <p-message severity="error" [text]="actionError()"></p-message>
                    }
                </div>
                <ng-template #footer>
                    <button pButton [label]="t('deleteDialog.annuler')"
                        class="p-button-outlined p-button-secondary"
                        [disabled]="actionLoading()"
                        (click)="closeDialog()">
                    </button>
                    <button pButton
                        [label]="actionLoading() ? t('comptes.creer.creation') : t('comptes.creer.confirmer')"
                        class="p-button-success"
                        [loading]="actionLoading()"
                        (click)="onCreer()">
                    </button>
                </ng-template>
            }
        </p-dialog>

        <!-- ══ DIALOG : MODIFIER LES RÔLES ══════════════════════════════════ -->
        <p-dialog
            [(visible)]="rolesDialogVisible"
            [modal]="true"
            [closable]="!actionLoading()"
            [style]="{ width: '420px' }"
            [header]="t('comptes.modifierRoles.titre') + (selectedUser() ? ' — ' + selectedUser()!.email : '')">

            @if (selectedUser()) {
                <div class="flex flex-col gap-4 pt-2">
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">{{ t('comptes.creer.roles') }} *</label>
                        <p-multiselect
                            [(ngModel)]="draftRoles"
                            [options]="roleOptions(t)"
                            optionLabel="label" optionValue="value"
                            [placeholder]="t('comptes.creer.rolesPlaceholder')"
                            [appendTo]="'body'"
                            styleClass="w-full">
                        </p-multiselect>
                    </div>
                    @if (actionError()) {
                        <p-message severity="error" [text]="actionError()"></p-message>
                    }
                </div>
                <ng-template #footer>
                    <button pButton [label]="t('deleteDialog.annuler')"
                        class="p-button-outlined p-button-secondary"
                        [disabled]="actionLoading()"
                        (click)="rolesDialogVisible = false; actionError.set('')">
                    </button>
                    <button pButton
                        [label]="actionLoading() ? t('comptes.modifierRoles.enregistrement') : t('comptes.modifierRoles.confirmer')"
                        [loading]="actionLoading()"
                        (click)="onModifierRoles()">
                    </button>
                </ng-template>
            }
        </p-dialog>

        <!-- ══ DIALOG : CONFIRMER RÉINITIALISATION ═══════════════════════════ -->
        <p-dialog
            [(visible)]="reinitDialogVisible"
            [modal]="true"
            [closable]="!actionLoading()"
            [style]="{ width: '440px' }"
            [header]="t('comptes.reinitialiser.titre')">

            @if (selectedUser()) {
                <p class="m-0" style="line-height:1.6;"
                    [innerHTML]="t('comptes.reinitialiser.message', { email: selectedUser()!.email })">
                </p>
                @if (actionError()) {
                    <p-message severity="error" [text]="actionError()" class="mt-3 block"></p-message>
                }
                <ng-template #footer>
                    <button pButton [label]="t('deleteDialog.annuler')"
                        class="p-button-outlined p-button-secondary"
                        [disabled]="actionLoading()"
                        (click)="reinitDialogVisible = false; actionError.set('')">
                    </button>
                    <button pButton
                        [label]="actionLoading() ? t('comptes.reinitialiser.reinitialisation') : t('comptes.reinitialiser.confirmer')"
                        class="p-button-warning"
                        [loading]="actionLoading()"
                        (click)="onReinit()">
                    </button>
                </ng-template>
            }
        </p-dialog>

        <!-- ══ DIALOG : DÉSACTIVER / RÉACTIVER ══════════════════════════════ -->
        <p-dialog
            [(visible)]="toggleDialogVisible"
            [modal]="true"
            [closable]="!actionLoading()"
            [style]="{ width: '440px' }"
            [header]="selectedUser()?.actif ? t('comptes.desactiver.titre') : t('comptes.reactiver.titre')">

            @if (selectedUser()) {
                <p class="m-0" style="line-height:1.6;"
                    [innerHTML]="selectedUser()!.actif
                        ? t('comptes.desactiver.message', { email: selectedUser()!.email })
                        : t('comptes.reactiver.message',  { email: selectedUser()!.email })">
                </p>
                @if (actionError()) {
                    <p-message severity="error" [text]="actionError()" class="mt-3 block"></p-message>
                }
                <ng-template #footer>
                    <button pButton [label]="t('deleteDialog.annuler')"
                        class="p-button-outlined p-button-secondary"
                        [disabled]="actionLoading()"
                        (click)="toggleDialogVisible = false; actionError.set('')">
                    </button>
                    <button pButton
                        [label]="actionLoading()
                            ? (selectedUser()!.actif ? t('comptes.desactiver.desactivation') : t('comptes.reactiver.reactivation'))
                            : (selectedUser()!.actif ? t('comptes.desactiver.confirmer') : t('comptes.reactiver.confirmer'))"
                        [class]="selectedUser()!.actif ? 'p-button-warning' : 'p-button-success'"
                        [loading]="actionLoading()"
                        (click)="onToggle()">
                    </button>
                </ng-template>
            }
        </p-dialog>

        <!-- ══ DIALOG : MOT DE PASSE TEMPORAIRE (affiché une seule fois) ════ -->
        <p-dialog
            [(visible)]="passwordDialogVisible"
            [modal]="true"
            [closable]="false"
            [style]="{ width: '480px' }"
            [header]="passwordDialogTitle()">

            <div class="flex flex-col gap-4 pt-2">
                <p-message severity="warn"
                    [text]="t('comptes.motDePasseTemporaire.avertissement')"
                    styleClass="w-full">
                </p-message>
                <div style="background:var(--p-surface-100); border:1px solid var(--p-surface-300); border-radius:6px; padding:14px 16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                    <code style="font-size:18px; font-weight:700; letter-spacing:0.08em; color:var(--p-text-color); flex:1; word-break:break-all;">{{ tempPassword() }}</code>
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

    </ng-container>
    `
})
export class ComptesListe implements OnInit {
    private utilisateurService = inject(UtilisateurService);
    private personnelService   = inject(PersonnelService);
    private transloco          = inject(TranslocoService);
    private langService        = inject(LanguageService);

    @ViewChild('tableRef') tableRef!: GescolTableComponent;

    readonly data          = signal<PageResponse<UtilisateurResponse> | 'error' | undefined>(undefined);
    readonly successMsg    = signal<string | null>(null);
    readonly actionLoading = signal(false);
    readonly actionError   = signal('');

    // Mot de passe temporaire — vidé dès la fermeture du dialog, jamais logué.
    readonly tempPassword          = signal('');
    readonly copied                = signal(false);
    readonly passwordDialogIsReset = signal(false);

    // Personnel sans compte — chargé à l'ouverture du dialog création
    private readonly personnelRaw  = signal<PersonnelResponse[]>([]);
    readonly personnelLoading      = signal(false);
    readonly filteredPersonnel     = signal<PersonnelItem[]>([]);

    // Filtres
    filterRoleValue:  RoleStaff | null = null;
    filterActifValue: boolean  | null  = null;
    private pendingRole:  RoleStaff | null = null;
    private pendingActif: boolean  | null  = null;

    // Cible courante pour les actions
    readonly selectedUser = signal<UtilisateurResponse | null>(null);

    // Visibilité des dialogs
    readonly activeDialog       = signal<'creer' | null>(null);
    dialogVisible               = false;
    rolesDialogVisible          = false;
    reinitDialogVisible         = false;
    toggleDialogVisible         = false;
    passwordDialogVisible       = false;

    // Champs du formulaire création / modification rôles
    draftEmail:     string        = '';
    draftNom:       string        = '';
    draftPrenom:    string        = '';
    draftRoles:     RoleStaff[]   = [];
    draftPersonnel: PersonnelItem | null = null;

    // Réactivité de la langue pour les computed basés sur transloco
    private readonly _lang = computed(() => this.langService.currentLang());

    readonly passwordDialogTitle = computed(() => {
        const _ = this._lang();
        return this.passwordDialogIsReset()
            ? this.transloco.translate('app.comptes.motDePasseTemporaire.titreMdpReset')
            : this.transloco.translate('app.comptes.motDePasseTemporaire.titre');
    });

    ngOnInit(): void {}

    // ── Table ────────────────────────────────────────────────────────────────

    columns(t: (k: string) => string): ColDef[] {
        return [
            { field: 'email',            header: t('comptes.colonnes.email'),     sortable: true },
            { field: 'rolesDisplay',     header: t('comptes.colonnes.roles'),      width: '200px' },
            { field: 'personnelDisplay', header: t('comptes.colonnes.personnel') },
            {
                field: 'actif', header: t('comptes.colonnes.statut'), width: '100px',
                boolean: true,
                booleanTrueLabel:  t('comptes.statut.actif'),
                booleanFalseLabel: t('comptes.statut.inactif')
            }
        ];
    }

    roleOptions(t: (k: string) => string) {
        return ROLES_STAFF.map(r => ({ label: t(`comptes.roles.${r}`), value: r }));
    }

    actifOptions(t: (k: string) => string) {
        return [
            { label: t('comptes.filtres.actif'),   value: true  },
            { label: t('comptes.filtres.inactif'),  value: false }
        ];
    }

    onLoad(event: GescolLoadEvent): void {
        this.loadData(event.page, event.size, event.sort);
    }

    onSearch(): void {
        this.pendingRole  = this.filterRoleValue;
        this.pendingActif = this.filterActifValue;
        this.tableRef?.resetPage();
    }

    onReset(): void {
        this.filterRoleValue  = null;
        this.filterActifValue = null;
        this.pendingRole      = null;
        this.pendingActif     = null;
        this.tableRef?.resetPage();
    }

    private loadData(page: number, size: number, sort: string): void {
        this.data.set(undefined);
        this.utilisateurService.lister(
            { role: this.pendingRole ?? undefined, actif: this.pendingActif ?? undefined },
            page, size, sort
        ).subscribe({
            next: (res) => {
                const enriched = {
                    ...res,
                    content: res.content.map(u => ({
                        ...u,
                        rolesDisplay: u.roles
                            .map(r => this.transloco.translate(`app.comptes.roles.${r}`))
                            .join(', '),
                        personnelDisplay: u.personnelNom
                            ? `${u.personnelPrenom ?? ''} ${u.personnelNom}`.trim()
                            : '—'
                    }))
                };
                this.data.set(enriched);
            },
            error: () => this.data.set('error')
        });
    }

    // ── Personnel autocomplete ────────────────────────────────────────────────

    private loadPersonnelSansCompte(): void {
        this.personnelLoading.set(true);
        this.personnelRaw.set([]);
        this.personnelService.listerSansCompte().subscribe({
            next:  (list) => { this.personnelRaw.set(list); this.personnelLoading.set(false); },
            error: ()     => { this.personnelRaw.set([]);   this.personnelLoading.set(false); }
        });
    }

    private toItem(p: PersonnelResponse): PersonnelItem {
        return {
            id: p.id,
            nom: p.nom,
            prenom: p.prenom,
            matricule: p.matricule,
            email: p.email,
            displayLabel: `${p.nom} ${p.prenom} — ${p.matricule}`
        };
    }

    filterPersonnel(event: AutoCompleteCompleteEvent): void {
        const q = event.query.trim().toLowerCase();
        const items = this.personnelRaw().map(p => this.toItem(p));
        this.filteredPersonnel.set(
            q ? items.filter(p =>
                `${p.nom} ${p.prenom} ${p.matricule}`.toLowerCase().includes(q)
            ) : items
        );
    }

    onPersonnelSelect(event: AutoCompleteSelectEvent): void {
        const p = event.value as PersonnelItem;
        this.draftNom    = p.nom;
        this.draftPrenom = p.prenom;
        if (p.email && !this.draftEmail.trim()) {
            this.draftEmail = p.email;
        }
    }

    onPersonnelClear(): void {
        this.draftPersonnel = null;
    }

    // ── Ouvrir dialogs ───────────────────────────────────────────────────────

    openCreer(_: null): void {
        this.draftEmail     = '';
        this.draftNom       = '';
        this.draftPrenom    = '';
        this.draftRoles     = [];
        this.draftPersonnel = null;
        this.actionError.set('');
        this.activeDialog.set('creer');
        this.dialogVisible = true;
        this.loadPersonnelSansCompte();
    }

    openModifierRoles(user: UtilisateurResponse): void {
        this.selectedUser.set(user);
        this.draftRoles = [...user.roles];
        this.actionError.set('');
        this.rolesDialogVisible = true;
    }

    openReinit(user: UtilisateurResponse): void {
        this.selectedUser.set(user);
        this.actionError.set('');
        this.reinitDialogVisible = true;
    }

    openToggle(user: UtilisateurResponse): void {
        this.selectedUser.set(user);
        this.actionError.set('');
        this.toggleDialogVisible = true;
    }

    closeDialog(): void {
        this.dialogVisible  = false;
        this.activeDialog.set(null);
        this.actionError.set('');
        this.draftPersonnel = null;
    }

    onDialogHide(): void {
        this.activeDialog.set(null);
        this.actionError.set('');
        this.draftPersonnel = null;
    }

    // ── Actions API ──────────────────────────────────────────────────────────

    onCreer(): void {
        const personnelId  = this.draftPersonnel?.id;
        const isEnseignant = this.draftRoles.includes('ENSEIGNANT');

        if (!this.draftEmail.trim() || this.draftRoles.length === 0) {
            this.actionError.set(this.transloco.translate('app.comptes.creer.erreurChamps'));
            return;
        }
        if (isEnseignant && !personnelId) {
            this.actionError.set(this.transloco.translate('app.comptes.creer.erreurEnseignantPersonnel'));
            return;
        }
        if (!personnelId && !this.draftNom.trim()) {
            this.actionError.set(this.transloco.translate('app.comptes.creer.erreurNomObligatoire'));
            return;
        }

        this.actionLoading.set(true);
        this.actionError.set('');
        this.utilisateurService.creer({
            email:       this.draftEmail.trim(),
            nom:         this.draftNom.trim()    || undefined,
            prenom:      this.draftPrenom.trim() || undefined,
            roles:       this.draftRoles,
            personnelId: personnelId || undefined
        }).subscribe({
            next: (res) => {
                this.actionLoading.set(false);
                this.closeDialog();
                this.passwordDialogIsReset.set(false);
                this.tempPassword.set(res.motDePasseTemporaire);
                this.passwordDialogVisible = true;
                this.tableRef?.resetPage();
            },
            error: (err) => {
                this.actionLoading.set(false);
                const msg = err?.error?.message;
                if (err?.status === 409 && msg?.toLowerCase().includes('personnel')) {
                    this.actionError.set(this.transloco.translate('app.comptes.creer.erreurPersonnelDejaLie'));
                } else {
                    this.actionError.set(msg ?? this.transloco.translate('deleteDialog.erreurGenerale'));
                }
            }
        });
    }

    onModifierRoles(): void {
        const user = this.selectedUser();
        if (!user || this.draftRoles.length === 0) return;
        this.actionLoading.set(true);
        this.actionError.set('');
        this.utilisateurService.modifierRoles(user.id, this.draftRoles).subscribe({
            next: () => {
                this.actionLoading.set(false);
                this.rolesDialogVisible = false;
                this.showSuccess('comptes.successRoles');
                this.tableRef?.resetPage();
            },
            error: (err) => {
                this.actionLoading.set(false);
                this.actionError.set(err?.error?.message ?? this.transloco.translate('deleteDialog.erreurGenerale'));
            }
        });
    }

    onReinit(): void {
        const user = this.selectedUser();
        if (!user) return;
        this.actionLoading.set(true);
        this.actionError.set('');
        this.utilisateurService.reinitialiserMotDePasse(user.id).subscribe({
            next: (res) => {
                this.actionLoading.set(false);
                this.reinitDialogVisible = false;
                this.passwordDialogIsReset.set(true);
                this.tempPassword.set(res.motDePasseTemporaire);
                this.passwordDialogVisible = true;
            },
            error: (err) => {
                this.actionLoading.set(false);
                this.actionError.set(err?.error?.message ?? this.transloco.translate('deleteDialog.erreurGenerale'));
            }
        });
    }

    onToggle(): void {
        const user = this.selectedUser();
        if (!user) return;
        this.actionLoading.set(true);
        this.actionError.set('');
        const obs = user.actif
            ? this.utilisateurService.desactiver(user.id)
            : this.utilisateurService.reactiver(user.id);
        const key = user.actif ? 'comptes.successDesactive' : 'comptes.successReactive';
        obs.subscribe({
            next: () => {
                this.actionLoading.set(false);
                this.toggleDialogVisible = false;
                this.showSuccess(key);
                this.tableRef?.resetPage();
            },
            error: (err) => {
                this.actionLoading.set(false);
                this.actionError.set(err?.error?.message ?? this.transloco.translate('deleteDialog.erreurGenerale'));
            }
        });
    }

    // ── Dialog mot de passe ──────────────────────────────────────────────────

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

    // ── Helpers ──────────────────────────────────────────────────────────────

    private showSuccess(key: string): void {
        this.successMsg.set(this.transloco.translate(`app.${key}`));
        setTimeout(() => this.successMsg.set(null), 4000);
    }
}
