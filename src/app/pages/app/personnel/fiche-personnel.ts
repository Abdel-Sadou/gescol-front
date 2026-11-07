import {
    ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { PersonnelService, PersonnelResponse } from '@/app/core/services/personnel.service';
import { AuthService } from '@/app/core/services/auth.service';

@Component({
    selector: 'app-fiche-personnel',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoDirective, ButtonModule, TagModule, SkeletonModule],
    styles: [`
        :host { display: block; }
        .fp-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 28px 32px; max-width: 860px; }
        .fp-header { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
        .fp-avatar {
            width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
            background: var(--color-surface-alt); border: 2px solid var(--color-border);
            display: flex; align-items: center; justify-content: center;
        }
        .fp-avatar i { font-size: 28px; color: var(--color-text-muted); }
        .fp-nom { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: var(--color-text); }
        .fp-matricule { font-size: 13px; color: var(--color-text-muted); font-family: monospace; }
        .fp-section { margin-bottom: 24px; }
        .fp-section-title {
            font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px;
            color: var(--color-text-muted); margin-bottom: 12px; padding-bottom: 6px;
            border-bottom: 1px solid var(--color-border);
        }
        .fp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 24px; }
        .fp-field { display: flex; flex-direction: column; gap: 2px; }
        .fp-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .4px; }
        .fp-value { font-size: 14px; color: var(--color-text); font-weight: 500; }
        .fp-value.muted { color: var(--color-text-muted); font-weight: 400; font-style: italic; }
        .fp-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
        @media print {
            .fp-actions { display: none; }
            :host { padding: 0; }
        }
    `],
    template: `
<ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
<div class="card" style="line-height:1.5;">

    <div class="fp-actions">
        <button pButton icon="pi pi-arrow-left" [label]="t('commun.retour')"
            class="p-button-outlined p-button-secondary p-button-sm"
            (click)="router.navigate(['/app/personnel'])">
        </button>
        @if (canModify()) {
            <button pButton icon="pi pi-pencil" [label]="t('personnel.fiche.btnEditer')"
                class="p-button-outlined p-button-sm"
                (click)="router.navigate(['/app/personnel', id(), 'editer'])">
            </button>
        }
        <button pButton icon="pi pi-print" [label]="t('commun.imprimer')"
            class="p-button-outlined p-button-secondary p-button-sm"
            (click)="imprimer()">
        </button>
    </div>

    @if (loading()) {
        <p-skeleton height="200px" borderRadius="12px"></p-skeleton>
    } @else if (!personnel()) {
        <p style="color:var(--color-danger)">{{ t('personnel.fiche.introuvable') }}</p>
    } @else {
        <div class="fp-card">
            <!-- Header -->
            <div class="fp-header">
                <div class="fp-avatar"><i class="pi pi-user"></i></div>
                <div>
                    <p class="fp-nom">{{ personnel()!.prenom }} {{ personnel()!.nom }}</p>
                    <span class="fp-matricule">{{ personnel()!.matricule }}</span>
                    &nbsp;
                    <p-tag
                        [value]="personnel()!.actif ? t('personnel.statut.actif') : t('personnel.statut.inactif')"
                        [severity]="personnel()!.actif ? 'success' : 'secondary'">
                    </p-tag>
                </div>
            </div>

            <!-- Identification -->
            <div class="fp-section">
                <p class="fp-section-title">{{ t('personnel.fiche.identification') }}</p>
                <div class="fp-grid">
                    <div class="fp-field">
                        <span class="fp-label">{{ t('personnel.colonnes.typePersonnel') }}</span>
                        <span class="fp-value">{{ t('personnel.typePersonnel.' + personnel()!.typePersonnel) }}</span>
                    </div>
                    <div class="fp-field">
                        <span class="fp-label">{{ t('personnel.colonnes.typeContrat') }}</span>
                        <span class="fp-value">{{ t('personnel.typeContrat.' + personnel()!.typeContrat) }}</span>
                    </div>
                    <div class="fp-field">
                        <span class="fp-label">{{ t('personnel.form.fonction') }}</span>
                        <span [class]="'fp-value' + (personnel()!.fonction ? '' : ' muted')">
                            {{ personnel()!.fonction || t('commun.nonRenseigne') }}
                        </span>
                    </div>
                    <div class="fp-field">
                        <span class="fp-label">{{ t('personnel.form.dateEmbauche') }}</span>
                        <span [class]="'fp-value' + (personnel()!.dateEmbauche ? '' : ' muted')">
                            {{ personnel()!.dateEmbauche ? formatDate(personnel()!.dateEmbauche!) : t('commun.nonRenseigne') }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Contact -->
            <div class="fp-section">
                <p class="fp-section-title">{{ t('personnel.fiche.contact') }}</p>
                <div class="fp-grid">
                    <div class="fp-field">
                        <span class="fp-label">{{ t('personnel.form.telephone') }}</span>
                        <span [class]="'fp-value' + (personnel()!.telephone ? '' : ' muted')">
                            {{ personnel()!.telephone || t('commun.nonRenseigne') }}
                        </span>
                    </div>
                    <div class="fp-field">
                        <span class="fp-label">{{ t('personnel.form.email') }}</span>
                        <span [class]="'fp-value' + (personnel()!.email ? '' : ' muted')">
                            {{ personnel()!.email || t('commun.nonRenseigne') }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Rémunération (SUPER_ADMIN + ECONOMAT seulement) -->
            @if (canVoirSalaire()) {
                <div class="fp-section">
                    <p class="fp-section-title">{{ t('personnel.fiche.remuneration') }}</p>
                    <div class="fp-grid">
                        <div class="fp-field">
                            <span class="fp-label">{{ t('personnel.form.salaireBase') }}</span>
                            <span [class]="'fp-value' + (personnel()!.salaireBase != null ? '' : ' muted')">
                                {{ personnel()!.salaireBase != null ? formatXAF(personnel()!.salaireBase!) : t('commun.nonRenseigne') }}
                            </span>
                        </div>
                        <div class="fp-field">
                            <span class="fp-label">{{ t('personnel.form.indemniteTransport') }}</span>
                            <span [class]="'fp-value' + (personnel()!.indemniteTransport != null ? '' : ' muted')">
                                {{ personnel()!.indemniteTransport != null ? formatXAF(personnel()!.indemniteTransport!) : t('commun.nonRenseigne') }}
                            </span>
                        </div>
                        <div class="fp-field">
                            <span class="fp-label">{{ t('personnel.form.numeroCompteBancaire') }}</span>
                            <span [class]="'fp-value' + (personnel()!.numeroCompteBancaire ? '' : ' muted')">
                                {{ personnel()!.numeroCompteBancaire || t('commun.nonRenseigne') }}
                            </span>
                        </div>
                        <div class="fp-field">
                            <span class="fp-label">{{ t('personnel.form.nomBanque') }}</span>
                            <span [class]="'fp-value' + (personnel()!.nomBanque ? '' : ' muted')">
                                {{ personnel()!.nomBanque || t('commun.nonRenseigne') }}
                            </span>
                        </div>
                    </div>
                </div>
            }

        </div>
    }

</div>
</ng-container>
    `
})
export class FichePersonnel implements OnInit {
    protected router         = inject(Router);
    private route            = inject(ActivatedRoute);
    private personnelService = inject(PersonnelService);
    private authService      = inject(AuthService);

    readonly id          = signal<string>('');
    readonly personnel   = signal<PersonnelResponse | null>(null);
    readonly loading     = signal(true);

    readonly canModify      = computed(() => {
        const r = this.authService.role();
        return r === 'SUPER_ADMIN' || r === 'SECRETARIAT';
    });
    readonly canVoirSalaire = computed(() => {
        const r = this.authService.role();
        return r === 'SUPER_ADMIN' || r === 'ECONOMAT';
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.id.set(id);
        this.personnelService.getById(id).subscribe({
            next:  p  => { this.personnel.set(p);    this.loading.set(false); },
            error: () => { this.personnel.set(null);  this.loading.set(false); }
        });
    }

    imprimer(): void { window.print(); }

    formatDate(iso: string): string {
        return new Date(iso).toLocaleDateString('fr-FR');
    }

    formatXAF(n: number): string {
        return n.toLocaleString('fr-FR') + ' XAF';
    }
}
