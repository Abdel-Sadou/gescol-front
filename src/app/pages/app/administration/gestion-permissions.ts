import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    computed,
    inject,
    signal,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
    AdministrationService,
    PermissionDto,
    RolePermissionsResponse,
} from '@/app/core/services/administration.service';

const ROLES_GERES = ['SECRETARIAT', 'ECONOMAT', 'ENSEIGNANT', 'COMMUNICATION'] as const;
type RoleGere = typeof ROLES_GERES[number];

@Component({
    selector: 'app-gestion-permissions',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoDirective, ToastModule],
    providers: [MessageService],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <p-toast />

        <div class="card">
            <div class="flex justify-between items-center mb-5 flex-wrap gap-3">
                <h2 class="text-xl font-semibold m-0">
                    <i class="pi pi-shield mr-2" style="color:var(--color-primary)"></i>
                    {{ t('permissions.titre') }}
                </h2>
            </div>

            <p class="text-sm mb-4" style="color:var(--color-text-muted)">
                {{ t('permissions.sousTitre') }}
            </p>

            @if (chargement()) {
                <div class="flex justify-center py-8">
                    <i class="pi pi-spin pi-spinner text-2xl" style="color:var(--color-primary)"></i>
                </div>
            } @else if (erreur()) {
                <div class="p-message p-message-error p-3 border-round">
                    <i class="pi pi-exclamation-triangle mr-2"></i>
                    {{ t('permissions.erreurChargement') }}
                </div>
            } @else {
                <div class="permissions-table-wrap">
                    <table class="permissions-table">
                        <thead>
                            <tr>
                                <th class="col-permission">{{ t('permissions.colPermission') }}</th>
                                <th class="col-desc">{{ t('permissions.colDescription') }}</th>
                                @for (role of roles; track role) {
                                    <th class="col-role">
                                        {{ t('permissions.roles.' + role) }}
                                    </th>
                                }
                            </tr>
                        </thead>
                        <tbody>
                            @for (perm of permissions(); track perm.id) {
                                <tr>
                                    <td class="col-permission">
                                        <code class="perm-code">{{ perm.nom }}</code>
                                    </td>
                                    <td class="col-desc text-sm">
                                        {{ perm.description ?? '—' }}
                                    </td>
                                    @for (role of roles; track role) {
                                        <td class="col-role text-center">
                                            <input
                                                type="checkbox"
                                                class="perm-checkbox"
                                                [checked]="hasPermission(role, perm.nom)"
                                                [disabled]="saving()[role]"
                                                (change)="togglePermission(role, perm.nom, $event)"
                                            />
                                            @if (saving()[role]) {
                                                <i class="pi pi-spin pi-spinner saving-spinner"></i>
                                            }
                                        </td>
                                    }
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>

                <p class="text-xs mt-4" style="color:var(--color-text-muted)">
                    <i class="pi pi-info-circle mr-1"></i>
                    {{ t('permissions.noteAdmin') }}
                </p>
            }
        </div>
    </ng-container>
    `,
    styles: [`
        .permissions-table-wrap {
            overflow-x: auto;
        }

        .permissions-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13.5px;
        }

        .permissions-table th {
            padding: 10px 14px;
            background: var(--color-surface-sunken);
            border-bottom: 2px solid var(--color-border);
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: var(--color-text-muted);
            white-space: nowrap;
        }

        .permissions-table td {
            padding: 10px 14px;
            border-bottom: 1px solid var(--color-border);
            vertical-align: middle;
        }

        .permissions-table tbody tr:hover td {
            background: var(--color-surface-sunken);
        }

        .col-permission { min-width: 220px; }
        .col-desc       { min-width: 260px; color: var(--color-text-body); }
        .col-role       { width: 110px; }

        .perm-code {
            display: inline-block;
            padding: 2px 8px;
            background: var(--color-surface-sunken);
            border: 1px solid var(--color-border);
            border-radius: 4px;
            font-family: var(--font-mono, monospace);
            font-size: 12px;
            color: var(--color-primary-dark);
        }

        .perm-checkbox {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: var(--color-primary);
        }

        .perm-checkbox:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .saving-spinner {
            font-size: 11px;
            margin-left: 4px;
            color: var(--color-primary);
            vertical-align: middle;
        }
    `]
})
export class GestionPermissions implements OnInit {
    private readonly svc      = inject(AdministrationService);
    private readonly toast    = inject(MessageService);

    readonly roles = ROLES_GERES;
    readonly chargement = signal(true);
    readonly erreur     = signal(false);
    readonly permissions = signal<PermissionDto[]>([]);

    // Map role → Set de noms de permissions actives
    private readonly rolePermsMap = signal<Record<string, Set<string>>>({});
    // Map role → est-ce qu'une sauvegarde est en cours
    readonly saving = signal<Record<string, boolean>>({
        SECRETARIAT: false, ECONOMAT: false, ENSEIGNANT: false, COMMUNICATION: false
    });

    ngOnInit(): void {
        let permsLoaded = false;
        let rolesLoaded = false;
        let permsData:   PermissionDto[]        = [];
        let rolesData:   RolePermissionsResponse[] = [];

        const tryFinalize = () => {
            if (!permsLoaded || !rolesLoaded) return;
            this.permissions.set(permsData);
            const map: Record<string, Set<string>> = {};
            for (const r of rolesData) {
                map[r.role] = new Set(r.permissions);
            }
            this.rolePermsMap.set(map);
            this.chargement.set(false);
        };

        this.svc.getAllPermissions().subscribe({
            next: data => { permsData = data; permsLoaded = true; tryFinalize(); },
            error: ()   => { this.erreur.set(true); this.chargement.set(false); }
        });

        this.svc.getAllRolePermissions().subscribe({
            next: data => { rolesData = data; rolesLoaded = true; tryFinalize(); },
            error: ()   => { this.erreur.set(true); this.chargement.set(false); }
        });
    }

    hasPermission(role: string, permNom: string): boolean {
        return this.rolePermsMap()[role]?.has(permNom) ?? false;
    }

    togglePermission(role: string, permNom: string, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        const current = new Set(this.rolePermsMap()[role] ?? []);
        if (checked) current.add(permNom);
        else         current.delete(permNom);

        // Mise à jour optimiste
        this.rolePermsMap.update(m => ({ ...m, [role]: current }));
        this.saving.update(s => ({ ...s, [role]: true }));

        this.svc.updateRolePermissions(role, Array.from(current)).subscribe({
            next: () => {
                this.saving.update(s => ({ ...s, [role]: false }));
                this.toast.add({ severity: 'success', summary: 'OK', life: 1800,
                    detail: `${role} mis à jour.` });
            },
            error: () => {
                // Rollback
                const rollback = new Set(current);
                if (checked) rollback.delete(permNom);
                else         rollback.add(permNom);
                this.rolePermsMap.update(m => ({ ...m, [role]: rollback }));
                this.saving.update(s => ({ ...s, [role]: false }));
                this.toast.add({ severity: 'error', summary: 'Erreur', life: 3500,
                    detail: 'Impossible de mettre à jour les permissions.' });
            }
        });
    }
}
