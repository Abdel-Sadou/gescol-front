import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { TranslocoDirective } from '@jsverse/transloco';
import { LanguageSwitcher } from '@/app/shared/components/language-switcher/language-switcher';
import { CobimagBase } from '@/app/shared/cobimag-base';
import { InscriptionService, InscriptionResponse } from '@/app/core/services/inscription.service';

// Zéro import PrimeNG — ADR-011 (zone Espace Parent).
@Component({
    selector: 'app-mes-inscriptions',
    standalone: true,
    imports: [TranslocoDirective, LanguageSwitcher],
    styles: [`@keyframes cob-spin { to { transform: rotate(360deg); } } .cob-spinner { animation: cob-spin 0.8s linear infinite; }`],
    template: `
<ng-container *transloco="let t; scope: 'parent'; prefix: 'parent'">
<div style="font-family:'Work Sans',sans-serif; color:#5F6161; background:#FFFFFF; min-height:100vh; line-height:1.5; overflow-x:clip;">

  <header style="position:sticky; top:0; z-index:50; background:#FFFFFF; box-shadow:0 1px 0 rgba(0,0,0,0.09);">
    <div style="display:flex; align-items:center; justify-content:space-between; padding:13px 24px; gap:16px; flex-wrap:nowrap;">
      <a href="#" (click)="goParent($event)" style="display:flex; align-items:center; gap:11px; text-decoration:none; flex-shrink:0;">
        <img src="/assets/logo-cobimag.png" width="38" height="38" alt="Logo COBIMAG" style="border-radius:50%; object-fit:cover; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.14);">
        <span style="font-family:'Lora',serif; font-weight:700; font-size:16px; color:#1c2a20; white-space:nowrap;">{{ t('mesInscriptions.titre') }}</span>
      </a>
      <div style="display:flex; align-items:center; gap:16px;">
        <app-language-switcher variant="light" />
        <a href="#" (click)="goParent($event)"
           style="display:inline-flex; align-items:center; gap:5px; font-size:13px; color:#5F6161; text-decoration:none; font-weight:500; white-space:nowrap;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {{ t('inscription.retour') }}
        </a>
      </div>
    </div>
  </header>

  <main style="max-width:720px; margin:0 auto; padding:36px 20px 72px;">
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:28px;">
      <h1 style="font-family:'Lora',serif; font-size:clamp(20px,3vw,26px); color:#1c2a20; margin:0; font-weight:700;">{{ t('mesInscriptions.titre') }}</h1>
      <a href="#" (click)="goNouvelleInscription($event)"
        style="background:#E8722C; color:#FFFFFF; font-weight:700; font-size:13px; padding:10px 18px; border-radius:2px; text-decoration:none; white-space:nowrap;">
        + {{ t('dashboard.nouvelleInscription') }}
      </a>
    </div>

    @if (loading()) {
      <div style="display:flex; align-items:center; gap:10px; color:#5F6161; font-size:13px; padding:20px 0;">
        <div class="cob-spinner" style="width:22px;height:22px;border-radius:50%;border:2px solid #E7E7E5;border-top-color:#008B47;flex-shrink:0;"></div>
        {{ t('dashboard.chargement') }}
      </div>

    } @else if (error()) {
      <p style="color:#C0392B; font-size:13px; padding:12px 0; margin:0;">{{ t('mesInscriptions.erreur') }}</p>

    } @else if (inscriptions().length === 0) {
      <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-top:3px solid #008B47; border-radius:2px; padding:48px 28px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:16px; box-shadow:0 1px 4px rgba(0,0,0,0.05);">
        <p style="font-size:17px; font-weight:700; color:#1c2a20; margin:0; font-family:'Lora',serif;">{{ t('mesInscriptions.aucune') }}</p>
        <a href="#" (click)="goNouvelleInscription($event)"
          style="background:#E8722C; color:#FFFFFF; font-weight:700; font-size:13.5px; padding:11px 22px; border-radius:2px; text-decoration:none;">
          {{ t('mesInscriptions.commencer') }}
        </a>
      </div>

    } @else {
      <div style="display:flex; flex-direction:column; gap:14px;">
        @for (insc of inscriptions(); track insc.id) {
          <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-top:3px solid #008B47; border-radius:2px; padding:20px 22px; display:flex; flex-direction:column; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">

            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
              <div>
                <p style="font-family:'Lora',serif; font-weight:700; color:#1c2a20; font-size:16px; margin:0 0 3px;">{{ insc.elevePrenom }} {{ insc.eleveNom }}</p>
                <p style="font-size:12.5px; color:#5F6161; margin:0;">{{ insc.classeLibelle }} — {{ insc.anneeScolaire }}</p>
              </div>
              <span [style]="statutStyle(insc.statut)">{{ t('mesInscriptions.statut.' + insc.statut) }}</span>
            </div>

            <p style="font-size:12px; color:#5F6161; margin:0;">
              {{ t('mesInscriptions.reserveeLe') }} {{ formatDate(insc.dateReservation) }}
              @if (insc.dateConfirmation) {
                · {{ t('mesInscriptions.confirmeeLe') }} {{ formatDate(insc.dateConfirmation) }}
              }
            </p>

            @if (insc.statut === 'CONFIRMEE') {
              <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding-top:10px; border-top:1px solid #F4EFE4;">
                <button (click)="downloadLettre(insc.id, $event)" [disabled]="!!pdfLoading()"
                  style="border:1.5px solid #008B47; color:#008B47; background:#FFFFFF; font-family:'Work Sans',sans-serif; font-weight:700; font-size:13px; padding:9px 18px; border-radius:2px; cursor:pointer;">
                  {{ pdfLoading() === insc.id ? t('mesInscriptions.lettreEnCours') : t('mesInscriptions.telechargerLettre') }}
                </button>
                @if (pdfError() === insc.id) {
                  <span style="font-size:11.5px; color:#C0392B;">{{ t('mesInscriptions.lettreErreur') }}</span>
                }
              </div>
            }

          </div>
        }
      </div>
    }
  </main>
</div>
</ng-container>
    `
})
export class MesInscriptions extends CobimagBase {
    private inscriptionService = inject(InscriptionService);

    private rawState = toSignal<InscriptionResponse[] | 'error'>(
        this.inscriptionService.getMesInscriptions().pipe(
            catchError(() => of('error' as const))
        )
    );

    readonly loading      = computed(() => this.rawState() === undefined);
    readonly error        = computed(() => this.rawState() === 'error');
    readonly inscriptions = computed<InscriptionResponse[]>(() => {
        const s = this.rawState();
        return Array.isArray(s) ? s : [];
    });

    readonly pdfLoading = signal<string | null>(null);
    readonly pdfError   = signal<string | null>(null);

    statutStyle(statut: 'RESERVEE' | 'CONFIRMEE' | 'ANNULEE'): string {
        const map: Record<string, string> = {
            RESERVEE:  'background:#FDECE1; color:#8a4416;',
            CONFIRMEE: 'background:#EAF5EE; color:#008B47;',
            ANNULEE:   'background:#F0F1EF; color:#5F6161;',
        };
        return (map[statut] ?? '') + ' font-size:11.5px; font-weight:700; padding:4px 12px; border-radius:20px; white-space:nowrap;';
    }

    formatDate(dt: string): string {
        return new Date(dt).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }

    downloadLettre(inscriptionId: string, e: Event): void {
        e.preventDefault();
        if (this.pdfLoading()) return;
        this.pdfError.set(null);
        this.pdfLoading.set(inscriptionId);
        this.inscriptionService.getLettreEngagementPdf(inscriptionId).pipe(
            take(1),
            catchError(() => of(null))
        ).subscribe(blob => {
            this.pdfLoading.set(null);
            if (!blob) { this.pdfError.set(inscriptionId); return; }
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = `lettre-engagement-${inscriptionId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}
