import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { TranslocoDirective } from '@jsverse/transloco';
import { CobimagBase } from '@/app/shared/cobimag-base';
import {
    InscriptionService,
    ClasseDisponibleResponse,
    CriteresInscriptionResponse,
    InscriptionResponse
} from '@/app/core/services/inscription.service';

// Zéro import PrimeNG — ADR-011 (zone Espace Parent).
@Component({
    selector: 'app-nouvelle-inscription',
    standalone: true,
    imports: [TranslocoDirective],
    template: `
<ng-container *transloco="let t; scope: 'parent'; prefix: 'parent'">
<div style="font-family:'Work Sans',sans-serif; color:#5F6161; background:#F7F8F6; min-height:100vh; line-height:1.5; overflow-x:clip;">

  <header style="position:sticky; top:0; z-index:50; background:#FFFFFF; box-shadow:0 1px 0 rgba(0,0,0,0.08);">
    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 24px; gap:16px; flex-wrap:nowrap;">
      <a href="#" (click)="goParent($event)" style="display:flex; align-items:center; gap:10px; color:#1c2a20; text-decoration:none; min-width:0; overflow:hidden;">
        <div style="width:34px;height:34px;border-radius:50%;background:#008B47;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:700;font-size:12px;color:#FFFFFF;flex-shrink:0;">EP</div>
        <span style="font-family:'Lora',serif; font-weight:700; font-size:15px; color:#1c2a20; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ t('inscription.titre') }}</span>
      </a>
      <a href="#" (click)="goParent($event)" style="color:#5F6161; font-size:13px; text-decoration:none; flex-shrink:0; white-space:nowrap;">{{ t('inscription.retour') }}</a>
    </div>
  </header>

  <main style="max-width:720px; margin:0 auto; padding:32px 20px 64px;">

    <!-- ══ STEPPER ══════════════════════════════════════════════════════════ -->
    <div style="display:flex; align-items:flex-start; justify-content:center; margin-bottom:40px; overflow-x:auto; padding:4px 0;">
      @for (n of steps; track n) {
        <div style="display:flex; align-items:flex-start;">
          <div style="display:flex; flex-direction:column; align-items:center; gap:5px; min-width:56px;">
            <div [style]="circleStyle(n)">
              @if (n < currentStep()) { ✓ } @else { {{n}} }
            </div>
            <span [style]="labelStyle(n)">{{ t('inscription.etape.' + n) }}</span>
          </div>
          @if (n < 5) {
            <div [style]="'width:44px; height:2px; margin-top:17px; flex-shrink:0; ' + (n < currentStep() ? 'background:#008B47;' : 'background:#E7E7E5;')"></div>
          }
        </div>
      }
    </div>

    <!-- ══ ÉTAPE 1 — CRITÈRES ═══════════════════════════════════════════════ -->
    @if (currentStep() === 1) {
      <div style="background:#FFFFFF; border-radius:4px; padding:28px 26px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="font-family:'Lora',serif; font-size:20px; color:#1c2a20; margin:0 0 6px; font-weight:700;">{{ t('inscription.criteres.titre') }}</h2>
        <p style="font-size:13px; color:#5F6161; margin:0 0 22px;">{{ t('inscription.criteres.description') }}</p>

        @if (criteresLoading()) {
          <div style="display:flex; align-items:center; gap:10px; color:#5F6161; font-size:13px; padding:24px 0;">
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid #E7E7E5;border-top-color:#008B47;flex-shrink:0;"></div>
            {{ t('inscription.criteres.chargement') }}
          </div>
        } @else if (criteresError()) {
          <p style="color:#C0392B; font-size:13px; padding:12px 0; margin:0;">{{ t('inscription.criteres.erreur') }}</p>
        } @else {
          <div style="background:#F7F8F6; border:1px solid #E7E7E5; border-radius:4px; padding:18px 20px; font-size:13.5px; line-height:1.75; white-space:pre-line; max-height:320px; overflow-y:auto; margin-bottom:24px; color:#1c2a20;">
            {{ criteresTexte() }}
          </div>
          <label style="display:flex; align-items:flex-start; gap:12px; cursor:pointer; margin-bottom:28px;">
            <input type="checkbox" [checked]="criteresAcceptes()" (change)="toggleAccept($event)"
              style="width:18px; height:18px; flex-shrink:0; accent-color:#008B47; margin-top:2px; cursor:pointer;">
            <span style="font-size:13.5px; color:#1c2a20; font-weight:600; line-height:1.5;">{{ t('inscription.criteres.accepter') }}</span>
          </label>
          <div style="display:flex; justify-content:flex-end;">
            <button (click)="goToStep2()" [disabled]="!criteresAcceptes()"
              [style]="btnPrimary(!criteresAcceptes())">
              {{ t('inscription.navigation.suivant') }} →
            </button>
          </div>
        }
      </div>
    }

    <!-- ══ ÉTAPE 2 — CLASSES DISPONIBLES ════════════════════════════════════ -->
    @if (currentStep() === 2) {
      <div style="background:#FFFFFF; border-radius:4px; padding:28px 26px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="font-family:'Lora',serif; font-size:20px; color:#1c2a20; margin:0 0 6px; font-weight:700;">{{ t('inscription.classes.titre') }}</h2>
        <p style="font-size:13px; color:#5F6161; margin:0 0 22px;">{{ t('inscription.classes.description') }}</p>

        @if (classesLoading()) {
          <div style="display:flex; align-items:center; gap:10px; color:#5F6161; font-size:13px; padding:24px 0;">
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid #E7E7E5;border-top-color:#008B47;flex-shrink:0;"></div>
            {{ t('inscription.classes.chargement') }}
          </div>
        } @else if (classesError()) {
          <p style="color:#C0392B; font-size:13px; padding:12px 0; margin:0;">{{ t('inscription.classes.erreur') }}</p>
        } @else {

          @if (classesFrancophones().length > 0) {
            <p style="font-size:11.5px; font-weight:700; color:#5F6161; letter-spacing:.06em; text-transform:uppercase; margin:0 0 10px;">{{ t('inscription.classes.francophone') }}</p>
            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
              @for (c of classesFrancophones(); track c.classeId) {
                <div (click)="selectClasse(c)" [style]="classeCardStyle(c.classeId)"
                     style="border-radius:4px; padding:14px 16px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; transition:border-color .15s;">
                  <span style="font-size:14px; font-weight:600; color:#1c2a20;">{{ c.classeLibelle }}</span>
                  <span style="font-size:13.5px; font-weight:700; color:#008B47; white-space:nowrap;">{{ formatMontant(c.montant) }} FCFA</span>
                </div>
              }
            </div>
          }

          @if (classesAnglophones().length > 0) {
            <p style="font-size:11.5px; font-weight:700; color:#5F6161; letter-spacing:.06em; text-transform:uppercase; margin:0 0 10px;">{{ t('inscription.classes.anglophone') }}</p>
            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
              @for (c of classesAnglophones(); track c.classeId) {
                <div (click)="selectClasse(c)" [style]="classeCardStyle(c.classeId)"
                     style="border-radius:4px; padding:14px 16px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; transition:border-color .15s;">
                  <span style="font-size:14px; font-weight:600; color:#1c2a20;">{{ c.classeLibelle }}</span>
                  <span style="font-size:13.5px; font-weight:700; color:#008B47; white-space:nowrap;">{{ formatMontant(c.montant) }} FCFA</span>
                </div>
              }
            </div>
          }

          @if (selectedClasseId()) {
            <div style="background:#EAF5EE; border-radius:4px; padding:12px 16px; margin-bottom:20px; font-size:13px; color:#1c2a20;">
              {{ t('inscription.classes.selectionne') }} <strong>{{ selectedClasseLibelle() }}</strong> — <strong>{{ formatMontant(selectedMontant()) }} FCFA</strong> / {{ selectedAnneeScolaire() }}
            </div>
          }

          <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <button (click)="prev()" style="border:1.5px solid #E7E7E5; color:#5F6161; background:#FFFFFF; font-family:'Work Sans',sans-serif; font-weight:700; font-size:14px; padding:11px 22px; border-radius:2px; cursor:pointer;">
              ← {{ t('inscription.navigation.precedent') }}
            </button>
            <button (click)="next()" [disabled]="!selectedClasseId()"
              [style]="btnPrimary(!selectedClasseId())">
              {{ t('inscription.navigation.suivant') }} →
            </button>
          </div>
        }
      </div>
    }

    <!-- ══ ÉTAPE 3 — RÉSERVATION ═════════════════════════════════════════════ -->
    @if (currentStep() === 3) {
      <div style="background:#FFFFFF; border-radius:4px; padding:28px 26px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="font-family:'Lora',serif; font-size:20px; color:#1c2a20; margin:0 0 6px; font-weight:700;">{{ t('inscription.reservation.titre') }}</h2>
        <p style="font-size:13px; color:#5F6161; margin:0 0 22px;">{{ t('inscription.reservation.description') }}</p>

        <!-- Résumé classe choisie -->
        <div style="background:#F7F8F6; border:1px solid #E7E7E5; border-radius:4px; padding:12px 16px; margin-bottom:24px; font-size:13px; color:#1c2a20;">
          <strong>{{ selectedClasseLibelle() }}</strong> — {{ formatMontant(selectedMontant()) }} FCFA
        </div>

        @if (!reservationConfirmee()) {
          <label style="display:flex; flex-direction:column; gap:6px; margin-bottom:20px;">
            <span style="font-size:13px; font-weight:600; color:#1c2a20;">{{ t('inscription.reservation.matriculeLabel') }}</span>
            <input type="text" [value]="matricule()" (input)="setMatricule($event)"
              [placeholder]="t('inscription.reservation.matriculePlaceholder')"
              style="border:1.5px solid #E7E7E5; border-radius:4px; padding:11px 14px; font-size:14px; font-family:'Work Sans',sans-serif; color:#1c2a20; outline:none; width:100%; box-sizing:border-box;">
          </label>

          @if (reservationError()) {
            <p style="color:#C0392B; font-size:13px; background:#FFF5F5; border:1px solid #FECACA; border-radius:4px; padding:10px 14px; margin:0 0 16px;">
              @if (reservationError() === '__404__') { {{ t('inscription.reservation.erreur404') }} }
              @else if (reservationError() === '__409__') { {{ t('inscription.reservation.erreur409') }} }
              @else { {{ t('inscription.reservation.erreur500') }} }
            </p>
          }

          <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:8px;">
            <button (click)="prev()" [disabled]="reservationLoading()"
              style="border:1.5px solid #E7E7E5; color:#5F6161; background:#FFFFFF; font-family:'Work Sans',sans-serif; font-weight:700; font-size:14px; padding:11px 22px; border-radius:2px; cursor:pointer;">
              ← {{ t('inscription.navigation.precedent') }}
            </button>
            <button (click)="reserver()" [disabled]="!matricule().trim() || reservationLoading()"
              [style]="btnPrimaryFlex(!matricule().trim() || reservationLoading())">
              @if (reservationLoading()) {
                <span style="width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,0.4);border-top-color:#FFF;display:inline-block;"></span>
              }
              {{ t('inscription.reservation.reserver') }}
            </button>
          </div>

        } @else {
          <!-- Réservation confirmée -->
          <div style="background:#EAF5EE; border:1px solid #B7DFC8; border-radius:4px; padding:18px 20px; margin-bottom:24px; display:flex; align-items:flex-start; gap:14px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#008B47" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <div>
              <p style="font-weight:700; color:#008B47; font-size:14px; margin:0 0 4px;">{{ t('inscription.reservation.succes') }}</p>
              <p style="font-size:13px; color:#1c2a20; margin:0;">{{ reservationEleveNom() }}</p>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end;">
            <button (click)="next()"
              style="background:#008B47; color:#FFFFFF; font-family:'Work Sans',sans-serif; font-weight:700; font-size:14px; padding:12px 28px; border:none; border-radius:2px; cursor:pointer;">
              {{ t('inscription.navigation.suivant') }} →
            </button>
          </div>
        }
      </div>
    }

    <!-- ══ ÉTAPE 4 — INFORMATIONS PARENT ════════════════════════════════════ -->
    @if (currentStep() === 4) {
      <div style="background:#FFFFFF; border-radius:4px; padding:28px 26px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="font-family:'Lora',serif; font-size:20px; color:#1c2a20; margin:0 0 6px; font-weight:700;">{{ t('inscription.informations.titre') }}</h2>
        <p style="font-size:13px; color:#5F6161; margin:0 0 22px;">{{ t('inscription.informations.description') }}</p>

        <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">
          <label style="display:flex; flex-direction:column; gap:6px;">
            <span style="font-size:13px; font-weight:600; color:#1c2a20;">{{ t('inscription.informations.telephoneLabel') }}</span>
            <input type="tel" [value]="infoTelephone()" (input)="infoTelephone.set(inputVal($event))"
              style="border:1.5px solid #E7E7E5; border-radius:4px; padding:11px 14px; font-size:14px; font-family:'Work Sans',sans-serif; color:#1c2a20; outline:none; width:100%; box-sizing:border-box;">
          </label>
          <label style="display:flex; flex-direction:column; gap:6px;">
            <span style="font-size:13px; font-weight:600; color:#1c2a20;">{{ t('inscription.informations.emailLabel') }}</span>
            <input type="email" [value]="infoEmail()" (input)="infoEmail.set(inputVal($event))"
              style="border:1.5px solid #E7E7E5; border-radius:4px; padding:11px 14px; font-size:14px; font-family:'Work Sans',sans-serif; color:#1c2a20; outline:none; width:100%; box-sizing:border-box;">
          </label>
          <label style="display:flex; flex-direction:column; gap:6px;">
            <span style="font-size:13px; font-weight:600; color:#1c2a20;">{{ t('inscription.informations.fonctionLabel') }}</span>
            <input type="text" [value]="infoFonction()" (input)="infoFonction.set(inputVal($event))"
              style="border:1.5px solid #E7E7E5; border-radius:4px; padding:11px 14px; font-size:14px; font-family:'Work Sans',sans-serif; color:#1c2a20; outline:none; width:100%; box-sizing:border-box;">
          </label>
          <label style="display:flex; flex-direction:column; gap:6px;">
            <span style="font-size:13px; font-weight:600; color:#1c2a20;">{{ t('inscription.informations.localisationLabel') }}</span>
            <input type="text" [value]="infoLocalisation()" (input)="infoLocalisation.set(inputVal($event))"
              style="border:1.5px solid #E7E7E5; border-radius:4px; padding:11px 14px; font-size:14px; font-family:'Work Sans',sans-serif; color:#1c2a20; outline:none; width:100%; box-sizing:border-box;">
          </label>
        </div>

        @if (infoError()) {
          <p style="color:#C0392B; font-size:13px; background:#FFF5F5; border:1px solid #FECACA; border-radius:4px; padding:10px 14px; margin:0 0 16px;">
            {{ t('inscription.informations.erreur') }}
          </p>
        }

        <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <button (click)="prev()" [disabled]="infoLoading()"
            style="border:1.5px solid #E7E7E5; color:#5F6161; background:#FFFFFF; font-family:'Work Sans',sans-serif; font-weight:700; font-size:14px; padding:11px 22px; border-radius:2px; cursor:pointer;">
            ← {{ t('inscription.navigation.precedent') }}
          </button>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button (click)="next()" [disabled]="infoLoading()"
              style="border:1.5px solid #008B47; color:#008B47; background:#FFFFFF; font-family:'Work Sans',sans-serif; font-weight:600; font-size:13.5px; padding:11px 18px; border-radius:2px; cursor:pointer;">
              {{ t('inscription.informations.passer') }}
            </button>
            <button (click)="majInfoParent()" [disabled]="infoLoading()"
              [style]="btnPrimaryFlex(infoLoading(), '12px 24px')">
              @if (infoLoading()) {
                <span style="width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,0.4);border-top-color:#FFF;display:inline-block;"></span>
              }
              {{ t('inscription.informations.valider') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══ ÉTAPE 5 — CONFIRMATION ════════════════════════════════════════════ -->
    @if (currentStep() === 5) {
      <div style="background:#FFFFFF; border-radius:4px; padding:28px 26px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="font-family:'Lora',serif; font-size:20px; color:#1c2a20; margin:0 0 6px; font-weight:700;">{{ t('inscription.confirmation.titre') }}</h2>
        <p style="font-size:13px; color:#5F6161; margin:0 0 22px;">{{ t('inscription.confirmation.description') }}</p>

        <!-- Récapitulatif -->
        <div style="background:#F7F8F6; border:1px solid #E7E7E5; border-radius:4px; padding:18px 20px; margin-bottom:24px;">
          <p style="font-size:12px; font-weight:700; color:#5F6161; letter-spacing:.06em; text-transform:uppercase; margin:0 0 12px;">{{ t('inscription.confirmation.recapitulatif') }}</p>
          <div style="display:flex; flex-direction:column; gap:8px; font-size:13.5px; color:#1c2a20;">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;">
              <span style="color:#5F6161;">{{ t('inscription.confirmation.eleve') }}</span>
              <strong>{{ reservationEleveNom() }}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;">
              <span style="color:#5F6161;">{{ t('inscription.confirmation.classe') }}</span>
              <strong>{{ selectedClasseLibelle() }}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;">
              <span style="color:#5F6161;">{{ t('inscription.confirmation.montant') }}</span>
              <strong style="color:#008B47;">{{ formatMontant(selectedMontant()) }} FCFA</strong>
            </div>
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;">
              <span style="color:#5F6161;">{{ t('inscription.confirmation.annee') }}</span>
              <strong>{{ selectedAnneeScolaire() }}</strong>
            </div>
          </div>
        </div>

        @if (!inscriptionConfirmee()) {
          @if (confirmError()) {
            <p style="color:#C0392B; font-size:13px; background:#FFF5F5; border:1px solid #FECACA; border-radius:4px; padding:10px 14px; margin:0 0 16px;">
              {{ t('inscription.confirmation.erreur') }}
            </p>
          }
          <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <button (click)="prev()" [disabled]="confirmLoading()"
              style="border:1.5px solid #E7E7E5; color:#5F6161; background:#FFFFFF; font-family:'Work Sans',sans-serif; font-weight:700; font-size:14px; padding:11px 22px; border-radius:2px; cursor:pointer;">
              ← {{ t('inscription.navigation.precedent') }}
            </button>
            <button (click)="confirmer()" [disabled]="confirmLoading()"
              [style]="btnPrimaryFlex(confirmLoading())">
              @if (confirmLoading()) {
                <span style="width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,0.4);border-top-color:#FFF;display:inline-block;"></span>
              }
              {{ t('inscription.confirmation.bouton') }}
            </button>
          </div>

        } @else {
          <!-- Inscription confirmée — succès -->
          <div style="display:flex; flex-direction:column; align-items:center; gap:18px; padding:16px 0 8px; text-align:center;">
            <div style="width:56px;height:56px;border-radius:50%;background:#EAF5EE;display:flex;align-items:center;justify-content:center;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#008B47" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p style="font-family:'Lora',serif; font-weight:700; font-size:18px; color:#1c2a20; margin:0 0 6px;">{{ t('inscription.confirmation.succes.titre') }}</p>
              <p style="font-size:13.5px; color:#5F6161; margin:0; max-width:420px; line-height:1.6;">{{ t('inscription.confirmation.succes.description') }}</p>
            </div>
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px; padding-top:4px;">
              <button (click)="downloadLettre($event)" [disabled]="!!lettreLoading()"
                [style]="btnOutlineFlex(lettreLoading())">
                @if (lettreLoading()) {
                  <span style="width:14px;height:14px;border-radius:50%;border:2px solid rgba(0,139,71,0.3);border-top-color:#008B47;display:inline-block;"></span>
                }
                {{ lettreLoading() ? t('mesInscriptions.lettreEnCours') : t('mesInscriptions.telechargerLettre') }}
              </button>
              @if (lettreError()) {
                <span style="font-size:12px; color:#C0392B;">{{ t('mesInscriptions.lettreErreur') }}</span>
              }
              <a href="#" (click)="goMesInscriptions($event)"
                style="font-size:13px; color:#5F6161; text-decoration:underline; margin-top:6px;">
                {{ t('inscription.confirmation.succes.voirInscriptions') }}
              </a>
            </div>
          </div>
        }
      </div>
    }

  </main>
</div>
</ng-container>
    `
})
export class NouvelleInscription extends CobimagBase {
    private inscriptionService = inject(InscriptionService);

    readonly steps = [1, 2, 3, 4, 5];
    readonly currentStep      = signal(1);
    readonly criteresAcceptes = signal(false);

    // ── Étape 1
    private criteresState = toSignal<CriteresInscriptionResponse | 'error'>(
        this.inscriptionService.getCriteres().pipe(catchError(() => of('error' as const)))
    );
    readonly criteresLoading = computed(() => this.criteresState() === undefined);
    readonly criteresError   = computed(() => this.criteresState() === 'error');
    readonly criteresTexte   = computed<string>(() => {
        const s = this.criteresState();
        return (s && typeof s !== 'string') ? s.texteCriteres : '';
    });

    // ── Étape 2 — chargé à la demande (lazy, démarré quand on arrive à l'étape 2)
    private classesState = signal<ClasseDisponibleResponse[] | 'error' | undefined>(undefined);
    private classesLoaded = false;

    readonly classesLoading = computed(() => this.classesState() === undefined);
    readonly classesError   = computed(() => this.classesState() === 'error');
    readonly classesFrancophones = computed<ClasseDisponibleResponse[]>(() => {
        const s = this.classesState();
        return Array.isArray(s) ? s.filter(c => c.sousSysteme === 'FRANCOPHONE') : [];
    });
    readonly classesAnglophones = computed<ClasseDisponibleResponse[]>(() => {
        const s = this.classesState();
        return Array.isArray(s) ? s.filter(c => c.sousSysteme === 'ANGLOPHONE') : [];
    });

    readonly selectedClasseId      = signal<string | null>(null);
    readonly selectedClasseLibelle = signal('');
    readonly selectedMontant       = signal(0);
    readonly selectedAnneeScolaire = signal('');

    // ── Étape 3
    readonly matricule           = signal('');
    readonly reservationLoading  = signal(false);
    readonly reservationError    = signal<string | null>(null);
    readonly reservationConfirmee = signal(false);
    readonly reservationEleveNom  = signal('');
    private inscriptionId         = signal<string | null>(null);

    // ── Étape 4
    readonly infoTelephone   = signal('');
    readonly infoEmail       = signal('');
    readonly infoFonction    = signal('');
    readonly infoLocalisation = signal('');
    readonly infoLoading     = signal(false);
    readonly infoError       = signal(false);

    // ── Étape 5
    readonly confirmLoading      = signal(false);
    readonly confirmError        = signal(false);
    readonly inscriptionConfirmee = signal(false);
    readonly lettreLoading        = signal(false);
    readonly lettreError          = signal(false);

    // ── Button style helpers — évitent les quotes dans les bindings [style] Angular
    btnPrimary(disabled: boolean, padding = '12px 28px'): string {
        return `background:#008B47;color:#FFFFFF;font-family:'Work Sans',sans-serif;font-weight:700;font-size:14px;padding:${padding};border:none;border-radius:2px;cursor:pointer;opacity:${disabled ? '0.4' : '1'};`;
    }
    btnPrimaryFlex(disabled: boolean, padding = '12px 28px'): string {
        return `background:#008B47;color:#FFFFFF;font-family:'Work Sans',sans-serif;font-weight:700;font-size:14px;padding:${padding};border:none;border-radius:2px;cursor:pointer;display:flex;align-items:center;gap:8px;opacity:${disabled ? '0.5' : '1'};`;
    }
    btnOutlineFlex(disabled: boolean): string {
        return `border:1.5px solid #008B47;color:#008B47;background:#FFFFFF;font-family:'Work Sans',sans-serif;font-weight:700;font-size:14px;padding:11px 24px;border-radius:2px;cursor:pointer;display:flex;align-items:center;gap:8px;opacity:${disabled ? '0.5' : '1'};`;
    }

    // ── Stepper styles
    circleStyle(n: number): string {
        const step   = this.currentStep();
        const done   = n < step;
        const active = n === step;
        const bg     = (done || active) ? '#008B47' : '#FFFFFF';
        const color  = (done || active) ? '#FFFFFF' : '#C9CBC9';
        const border = (done || active) ? 'none' : '2px solid #E7E7E5';
        return `width:34px;height:34px;border-radius:50%;background:${bg};color:${color};border:${border};` +
               `display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;`;
    }
    labelStyle(n: number): string {
        const step   = this.currentStep();
        const active = n === step;
        const past   = n < step;
        return `font-size:10.5px; white-space:nowrap; text-align:center; ` +
               `font-weight:${active ? '700' : '400'}; ` +
               `color:${(active || past) ? '#008B47' : '#C9CBC9'};`;
    }

    // ── Étape 1
    toggleAccept(e: Event): void {
        this.criteresAcceptes.set((e.target as HTMLInputElement).checked);
    }
    goToStep2(): void {
        this.currentStep.set(2);
        this.loadClassesIfNeeded();
    }

    // ── Étape 2
    private loadClassesIfNeeded(): void {
        if (this.classesLoaded) return;
        this.classesLoaded = true;
        this.classesState.set(undefined);
        this.inscriptionService.getClassesDisponibles().pipe(
            take(1),
            catchError(() => of('error' as const))
        ).subscribe(res => this.classesState.set(res));
    }

    selectClasse(c: ClasseDisponibleResponse): void {
        this.selectedClasseId.set(c.classeId);
        this.selectedClasseLibelle.set(c.classeLibelle);
        this.selectedMontant.set(c.montant);
        this.selectedAnneeScolaire.set(c.anneeScolaire);
    }

    classeCardStyle(classeId: string): string {
        const selected = this.selectedClasseId() === classeId;
        return selected
            ? 'background:#EAF5EE; border:2px solid #008B47;'
            : 'background:#FFFFFF; border:1.5px solid #E7E7E5;';
    }

    formatMontant(n: number): string {
        return new Intl.NumberFormat('fr-FR').format(n);
    }

    // ── Étape 3
    setMatricule(e: Event): void {
        this.matricule.set((e.target as HTMLInputElement).value);
        this.reservationError.set(null);
    }

    reserver(): void {
        const matricule = this.matricule().trim();
        const classeId  = this.selectedClasseId();
        if (!matricule || !classeId || this.reservationLoading()) return;
        this.reservationLoading.set(true);
        this.reservationError.set(null);
        this.inscriptionService.reserver(matricule, classeId).pipe(
            take(1),
            catchError(err => {
                const status = err?.status;
                if (status === 404) this.reservationError.set('__404__');
                else if (status === 409) this.reservationError.set('__409__');
                else this.reservationError.set('__500__');
                this.reservationLoading.set(false);
                return of(null);
            })
        ).subscribe(res => {
            if (!res) return;
            this.reservationLoading.set(false);
            this.inscriptionId.set(res.id);
            this.reservationEleveNom.set(`${res.elevePrenom} ${res.eleveNom}`);
            this.reservationConfirmee.set(true);
        });
    }

    // ── Étape 4
    inputVal(e: Event): string {
        return (e.target as HTMLInputElement).value;
    }

    majInfoParent(): void {
        const id = this.inscriptionId();
        if (!id || this.infoLoading()) return;
        this.infoLoading.set(true);
        this.infoError.set(false);
        const data = {
            telephone:    this.infoTelephone() || undefined,
            email:        this.infoEmail() || undefined,
            fonction:     this.infoFonction() || undefined,
            localisation: this.infoLocalisation() || undefined,
        };
        this.inscriptionService.majInformationsParent(id, data).pipe(
            take(1),
            catchError(() => of(null))
        ).subscribe(res => {
            this.infoLoading.set(false);
            if (!res) { this.infoError.set(true); return; }
            this.next();
        });
    }

    // ── Étape 5
    confirmer(): void {
        const id = this.inscriptionId();
        if (!id || this.confirmLoading()) return;
        this.confirmLoading.set(true);
        this.confirmError.set(false);
        this.inscriptionService.confirmer(id).pipe(
            take(1),
            catchError(() => of(null))
        ).subscribe(res => {
            this.confirmLoading.set(false);
            if (!res) { this.confirmError.set(true); return; }
            this.inscriptionConfirmee.set(true);
        });
    }

    downloadLettre(e: Event): void {
        e.preventDefault();
        const id = this.inscriptionId();
        if (!id || this.lettreLoading()) return;
        this.lettreLoading.set(true);
        this.lettreError.set(false);
        this.inscriptionService.getLettreEngagementPdf(id).pipe(
            take(1),
            catchError(() => of(null))
        ).subscribe(blob => {
            this.lettreLoading.set(false);
            if (!blob) { this.lettreError.set(true); return; }
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = `lettre-engagement-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // ── Navigation
    next(): void { if (this.currentStep() < 5) this.currentStep.update(s => s + 1); }
    prev(): void {
        const step = this.currentStep();
        if (step > 1) {
            this.currentStep.update(s => s - 1);
            if (step === 3) this.loadClassesIfNeeded();
        }
    }
}
