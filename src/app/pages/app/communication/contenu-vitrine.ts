import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@/app/core/services/auth.service';
import { VitrineService, ContenuVitrineResponse } from '@/app/core/services/vitrine.service';

// Clés fixes lues dans vitrine.ts — ne pas ajouter de clé arbitraire ici.
interface CleConfig {
    cle: string;
    hasFichier: boolean;   // true = afficher le champ URL de fichier
    placeholder: string;
}

const CLES: CleConfig[] = [
    {
        cle: 'MOT_FONDATEUR',
        hasFichier: false,
        placeholder: "Notre établissement est né d'une conviction profonde : toute réussite scolaire repose d'abord sur la rigueur, l'engagement et un environnement bienveillant."
    },
    {
        cle: 'HORAIRES_COURS',
        hasFichier: true,
        placeholder: 'Lundi – Vendredi : 7h00 – 15h30\nÉtude surveillée : 15h30 – 17h00\nPortail ouvert dès 6h30'
    },
    {
        cle: 'ACTIVITES_PERISCOLAIRES',
        hasFichier: true,
        placeholder: 'Clubs de langues (français / anglais), sport, musique, théâtre et arts plastiques, soutien scolaire.'
    },
    {
        cle: 'COMMENT_INSCRIRE',
        hasFichier: true,
        placeholder: "Renseignez-vous auprès du secrétariat pour connaître les modalités d'inscription et les pièces à fournir."
    }
];

interface KeyState {
    cle: string;
    hasFichier: boolean;
    contenu: string;
    fichierUrl: string;
    initialContenu: string;
    initialFichierUrl: string;
    dirty: boolean;
    loading: boolean;
    saving: boolean;
    saved: boolean;
    error: string | null;
}

@Component({
    selector: 'app-contenu-vitrine',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, FormsModule, TranslocoDirective,
        ButtonModule, InputTextModule, TextareaModule, MessageModule
    ],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="card">

            <!-- En-tête page -->
            <div class="flex items-center gap-3 mb-5">
                <div style="width:48px;height:48px;border-radius:14px;background:var(--p-primary-50);
                            display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="pi pi-file-edit" style="font-size:1.4rem;color:var(--p-primary-color)"></i>
                </div>
                <div>
                    <h2 class="text-xl font-semibold m-0">{{ t('communication.contenu.titre') }}</h2>
                    <p class="text-sm m-0 mt-0.5" style="color:var(--p-surface-400)">
                        {{ t('communication.contenu.sousTitre') }}
                    </p>
                </div>
            </div>

            <!-- Cartes (p-fluid retiré — il forçait width:100% sur le bouton Enregistrer) -->
            <div class="flex flex-col gap-4">
                @for (state of keyStates(); track state.cle) {
                    <div style="border:1px solid var(--p-surface-200);border-radius:12px;overflow:hidden">

                        <!-- ── En-tête de la carte (hors de p-fluid) ── -->
                        <div style="background:var(--p-surface-50);
                                    border-bottom:1px solid var(--p-surface-200);
                                    padding:16px 20px;
                                    display:flex;align-items:flex-start;
                                    justify-content:space-between;gap:16px">

                            <!-- Gauche : badge + label + description -->
                            <div style="flex:1;min-width:0">
                                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                                    <span style="display:inline-block;padding:2px 8px;border-radius:6px;
                                                 background:var(--p-surface-200);color:var(--p-surface-600);
                                                 font-family:monospace;font-size:11px;font-weight:700;
                                                 letter-spacing:.05em;white-space:nowrap">
                                        {{ state.cle }}
                                    </span>
                                    @if (state.dirty) {
                                        <span style="font-size:11px;font-weight:600;
                                                     color:var(--p-orange-500,#f97316)">
                                            ● {{ t('communication.contenu.nonEnregistre') }}
                                        </span>
                                    }
                                </div>
                                <p class="font-semibold text-sm m-0">
                                    {{ t('communication.contenu.cles.' + state.cle + '.label') }}
                                </p>
                                <p class="text-sm m-0" style="margin-top:3px;color:var(--p-surface-400)">
                                    {{ t('communication.contenu.cles.' + state.cle + '.description') }}
                                </p>
                            </div>

                            <!-- Droite : bouton Enregistrer (flex-shrink:0 + width:auto pour contrecarrer p-fluid) -->
                            @if (canWrite()) {
                                <button pButton
                                    [label]="t('communication.contenu.enregistrer')"
                                    [loading]="state.saving"
                                    [disabled]="state.loading || !state.dirty"
                                    (click)="save(state)"
                                    style="flex-shrink:0;white-space:nowrap">
                                </button>
                            }
                        </div>

                        <!-- ── Corps de la carte ── -->
                        <div style="padding:16px 20px" class="flex flex-col gap-3">

                            @if (state.loading) {
                                <div class="flex justify-center py-4">
                                    <i class="pi pi-spin pi-spinner"
                                       style="font-size:1.5rem;color:var(--p-primary-color)"></i>
                                </div>
                            } @else {

                                <!-- Textarea contenu -->
                                <div class="flex flex-col gap-1">
                                    @if (!state.contenu && !state.dirty) {
                                        <small class="italic" style="color:var(--p-surface-400)">
                                            {{ t('communication.contenu.nonRenseigne') }}
                                        </small>
                                    }
                                    <textarea pTextarea
                                        [ngModel]="state.contenu"
                                        (ngModelChange)="onContenuChange(state.cle, $event)"
                                        rows="5"
                                        [placeholder]="getPlaceholder(state.cle)"
                                        [disabled]="!canWrite()"
                                        style="resize:vertical;width:100%">
                                    </textarea>
                                </div>

                                <!-- Champ fichierUrl — uniquement si la clé le supporte -->
                                @if (state.hasFichier) {
                                    <div class="flex flex-col gap-1">
                                        <label class="font-semibold text-xs"
                                               style="color:var(--p-surface-500)">
                                            {{ t('communication.contenu.fichierUrlLabel') }}
                                        </label>
                                        <input pInputText
                                            [ngModel]="state.fichierUrl"
                                            (ngModelChange)="onFichierChange(state.cle, $event)"
                                            type="text"
                                            [placeholder]="t('communication.contenu.fichierUrlPh')"
                                            [disabled]="!canWrite()"
                                            style="width:100%" />
                                        <small style="color:var(--p-surface-400)">
                                            {{ t('communication.contenu.avisUrl') }}
                                        </small>
                                    </div>
                                }

                                <!-- Feedback -->
                                @if (state.saved && !state.dirty) {
                                    <p-message severity="success"
                                        [text]="t('communication.contenu.succes')">
                                    </p-message>
                                }
                                @if (state.error) {
                                    <p-message severity="error" [text]="state.error"></p-message>
                                }
                            }
                        </div>

                    </div>
                }
            </div>

        </div>
    </ng-container>
    `
})
export class ContenuVitrine implements OnInit {
    private svc  = inject(VitrineService);
    private auth = inject(AuthService);
    private t9n  = inject(TranslocoService);

    readonly keyStates = signal<KeyState[]>(
        CLES.map(c => ({
            cle: c.cle, hasFichier: c.hasFichier,
            contenu: '', fichierUrl: '',
            initialContenu: '', initialFichierUrl: '',
            dirty: false, loading: false, saving: false, saved: false, error: null
        }))
    );

    readonly canWrite = computed(() => {
        const r = this.auth.role();
        return r === 'SUPER_ADMIN' || r === 'COMMUNICATION';
    });

    ngOnInit(): void {
        for (const cfg of CLES) {
            this.loadKey(cfg.cle);
        }
    }

    private loadKey(cle: string): void {
        this.updateState(cle, { loading: true });
        this.svc.getContenu(cle).subscribe({
            next: res => this.updateState(cle, {
                contenu:           res.contenu ?? '',
                fichierUrl:        res.fichierUrl ?? '',
                initialContenu:    res.contenu ?? '',
                initialFichierUrl: res.fichierUrl ?? '',
                dirty:   false,
                loading: false
            }),
            // 404 = clé pas encore en base — champ vide, pas une erreur
            error: () => this.updateState(cle, {
                contenu: '', fichierUrl: '', initialContenu: '', initialFichierUrl: '',
                dirty: false, loading: false
            })
        });
    }

    onContenuChange(cle: string, value: string): void {
        this.updateState(cle, { contenu: value, dirty: true, saved: false });
    }

    onFichierChange(cle: string, value: string): void {
        this.updateState(cle, { fichierUrl: value, dirty: true, saved: false });
    }

    save(state: KeyState): void {
        this.updateState(state.cle, { saving: true, error: null, saved: false });
        this.svc.majContenu(state.cle, {
            contenu:    state.contenu    || undefined,
            fichierUrl: state.fichierUrl || undefined
        }).subscribe({
            next: res => this.updateState(state.cle, {
                saving: false, saved: true, dirty: false,
                initialContenu:    res.contenu ?? '',
                initialFichierUrl: res.fichierUrl ?? ''
            }),
            error: err => {
                const msg = err?.error?.message
                    ?? this.t9n.translate('app.communication.commun.erreurEnregistrement');
                this.updateState(state.cle, {
                    saving: false,
                    error: typeof msg === 'string' ? msg : String(msg)
                });
            }
        });
    }

    getPlaceholder(cle: string): string {
        return CLES.find(c => c.cle === cle)?.placeholder ?? '';
    }

    private updateState(cle: string, patch: Partial<KeyState>): void {
        this.keyStates.update(states =>
            states.map(s => s.cle === cle ? { ...s, ...patch } : s)
        );
    }
}
