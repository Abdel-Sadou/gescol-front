import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { map, switchMap, catchError, filter, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LanguageSwitcher } from '@/app/shared/components/language-switcher/language-switcher';
import { AuthService } from '@/app/core/services/auth.service';
import { LanguageService } from '@/app/core/services/language.service';
import { CobimagBase } from '@/app/shared/cobimag-base';
import { formatXAF } from '@/app/data/parent.data';
import {
    ParentDashboardService,
    EnfantResponse,
    SuiviEleveResponse,
    VersementResponse,
} from '@/app/core/services/parent-dashboard.service';

// Zéro import PrimeNG — ADR-011 (zone Espace Parent).
@Component({
    selector: 'app-parent-dashboard',
    standalone: true,
    imports: [TranslocoDirective, LanguageSwitcher],
    styles: [`@keyframes cob-spin { to { transform: rotate(360deg); } } .cob-spinner { animation: cob-spin 0.8s linear infinite; }`],
    template: `
<ng-container *transloco="let t; scope: 'parent'; prefix: 'parent'">
<div style="font-family:'Work Sans',sans-serif; color:#5F6161; background:#FFFFFF; min-height:100vh; line-height:1.5; overflow-x:clip;">

  <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
  <header style="position:sticky; top:0; z-index:50; background:#FFFFFF; box-shadow:0 1px 0 rgba(0,0,0,0.09);">
    <div style="display:flex; align-items:center; justify-content:space-between; padding:13px 24px; gap:16px; flex-wrap:nowrap;">

      <a href="#" (click)="goLanding($event)" style="display:flex; align-items:center; gap:11px; text-decoration:none; flex-shrink:0;">
        <img src="/assets/logo-cobimag.png" [attr.width]="logoParentSize" [attr.height]="logoParentSize" alt="Logo établissement" style="border-radius:50%; object-fit:cover; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.14);">
        <span style="display:flex; flex-direction:column; line-height:1.2;">
          <span style="font-family:'Lora',serif; font-weight:700; font-size:16px; color:#1c2a20; white-space:nowrap;">{{ t('dashboard.zone') }}</span>
          @if (showSubtitle) {
            <span style="font-size:10.5px; font-style:italic; color:#5F6161; white-space:nowrap;">{{ t('dashboard.sousTitre') }}</span>
          }
        </span>
      </a>

      <div style="display:flex; align-items:center; gap:20px; flex-shrink:0; flex-wrap:nowrap;">

        <!-- Nav principale -->
        <div style="display:flex; align-items:center; gap:6px;">
          <a href="#" (click)="goMesInscriptions($event)" style="color:#1c2a20; font-weight:600; font-size:13px; padding:8px 12px; border-radius:2px; text-decoration:none; white-space:nowrap;">
            {{ t('dashboard.mesInscriptions') }}
          </a>
          <a href="#" (click)="goNouvelleInscription($event)" style="background:#E8722C; color:#FFFFFF; font-weight:700; font-size:13px; padding:9px 18px; border-radius:2px; text-decoration:none; white-space:nowrap;">
            + {{ t('dashboard.nouvelleInscription') }}
          </a>
        </div>

        <!-- Zone utilisateur -->
        <div style="display:flex; align-items:center; gap:12px;">
          <!-- Cloche notifications (placeholder — API à venir) -->
          <button style="position:relative; background:none; border:none; cursor:pointer; width:34px; height:34px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#5F6161;" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          @if (parentDisplayName()) {
            <span [title]="parentDisplayName()" style="width:32px; height:32px; border-radius:50%; background:#EAF5EE; border:1.5px solid #BFE3CD; color:#008B47; font-weight:700; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; cursor:default;">
              {{ parentDisplayName()[0].toUpperCase() }}
            </span>
          }
          <app-language-switcher variant="light" />
          <a href="#" (click)="onDeconnexion($event)"
             style="display:inline-flex; align-items:center; gap:5px; border:1.5px solid #E7E7E5; color:#5F6161; font-weight:600; font-size:12.5px; padding:7px 13px; border-radius:2px; text-decoration:none; white-space:nowrap;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {{ t('dashboard.deconnexion') }}
          </a>
        </div>

      </div>

    </div>
  </header>

  <!-- ══ BANDE HERO VERTE ════════════════════════════════════════════════ -->
  <section style="position:relative; background:#00532B; padding:44px 24px 50px; overflow:hidden;">
    <div style="position:absolute; inset:0; background-image:repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 22px); pointer-events:none;"></div>
    <div style="position:absolute; right:-70px; top:-70px; width:260px; height:260px; border:2px solid rgba(255,255,255,0.07); border-radius:50%; pointer-events:none;"></div>
    <div style="position:absolute; right:60px; bottom:-100px; width:180px; height:180px; border:1.5px solid rgba(255,255,255,0.05); border-radius:50%; pointer-events:none;"></div>
    <div style="position:relative; z-index:1; max-width:1180px; margin:0 auto;">
      <p style="text-transform:uppercase; letter-spacing:1.5px; font-size:11.5px; font-weight:700; color:#E8722C; margin:0 0 14px;">{{ t('dashboard.zone') }}</p>
      <h1 style="font-family:'Lora',serif; font-size:clamp(22px,3vw,30px); font-weight:700; color:#FFFFFF; margin:0 0 12px; line-height:1.15;">{{ t('dashboard.bonjour') }}</h1>
      <p style="font-size:14.5px; color:rgba(255,255,255,0.8); margin:0; max-width:520px; line-height:1.65;">{{ t('dashboard.description') }}</p>
    </div>
  </section>

  <!-- ══ CONTENU PRINCIPAL ═══════════════════════════════════════════════ -->
  <main style="max-width:1180px; margin:0 auto; padding:40px 24px 80px;">

    @if (childrenLoading()) {
      <div style="display:flex; align-items:center; justify-content:center; min-height:40vh; flex-direction:column; gap:18px;">
        <div class="cob-spinner" style="width:36px; height:36px; border-radius:50%; border:3px solid #E7E7E5; border-top-color:#008B47;"></div>
        <p style="font-size:13px; color:#5F6161; margin:0;">{{ t('dashboard.chargement') }}</p>
      </div>

    } @else if (childrenError()) {
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:40vh; gap:16px; text-align:center; padding:32px;">
        <div style="width:56px; height:56px; border-radius:50%; background:#FDECE1; border:2px solid #F0C39E; display:flex; align-items:center; justify-content:center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8a4416" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#8a4416"/>
          </svg>
        </div>
        <p style="font-family:'Lora',serif; font-size:18px; font-weight:700; color:#1c2a20; margin:0;">{{ t('dashboard.erreur.titre') }}</p>
        <p style="font-size:13.5px; color:#5F6161; margin:0;">{{ t('dashboard.erreur.description') }}</p>
        <a href="#" (click)="reload($event)" style="background:#008B47; color:#FFFFFF; font-weight:700; font-size:13.5px; padding:12px 24px; border-radius:2px; text-decoration:none; margin-top:4px;">
          {{ t('dashboard.erreur.reessayer') }}
        </a>
      </div>

    } @else if (enfants().length === 0) {

      <!-- ══ EMPTY STATE ═══════════════════════════════════════════════════ -->
      <div style="display:flex; flex-direction:column; align-items:center; text-align:center; padding:56px 24px 48px;">
        <div style="width:84px; height:84px; border-radius:50%; background:#EAF5EE; border:2px solid #BFE3CD; display:flex; align-items:center; justify-content:center; margin-bottom:26px;">
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            <circle cx="21" cy="15" r="8" fill="#BFE3CD"/>
            <path d="M5 40c0-8.837 7.163-16 16-16s16 7.163 16 16H5Z" fill="#BFE3CD"/>
          </svg>
        </div>
        <p style="text-transform:uppercase; letter-spacing:1.5px; font-size:11.5px; font-weight:700; color:#E8722C; margin:0 0 14px;">{{ t('dashboard.aucunEnfant.surtitle') }}</p>
        <h2 style="font-family:'Lora',serif; font-size:clamp(20px,2.5vw,26px); font-weight:700; color:#1c2a20; margin:0 0 14px; line-height:1.2;">{{ t('dashboard.aucunEnfant.titre') }}</h2>
        <p style="font-size:14.5px; color:#5F6161; margin:0 0 34px; max-width:420px; line-height:1.65;">{{ t('dashboard.aucunEnfant.description') }}</p>
        <a href="#" (click)="goNouvelleInscription($event)" style="background:#E8722C; color:#FFFFFF; font-weight:700; font-size:15px; padding:14px 30px; border-radius:2px; text-decoration:none; display:inline-block;">
          {{ t('dashboard.aucunEnfant.cta') }}
        </a>
        <div style="width:1px; height:44px; background:#E7E7E5; margin:38px auto;"></div>
        <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-top:3px solid #008B47; border-radius:2px; padding:24px 28px; max-width:460px; width:100%; text-align:left; box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <h3 style="font-family:'Lora',serif; font-size:17px; color:#1c2a20; margin:0 0 10px; font-weight:700;">{{ t('dashboard.aucunEnfant.cardTitre') }}</h3>
          <p style="font-size:13.5px; color:#5F6161; margin:0; line-height:1.65;">{{ t('dashboard.aucunEnfant.cardDesc') }}</p>
        </div>
      </div>

    } @else {

      <!-- ══ SÉLECTEUR D'ENFANTS ══════════════════════════════════════════ -->
      @if (enfants().length > 1) {
        <p style="text-transform:uppercase; letter-spacing:1.3px; font-size:12px; font-weight:700; color:#E8722C; margin:0 0 14px;">{{ t('dashboard.mesEnfants') }}</p>
      }
      <div style="display:flex; gap:14px; overflow-x:auto; padding-bottom:6px; margin-bottom:30px;">
        @for (child of decoratedChildren(); track child.eleveId) {
          <button (click)="selectChild(child.eleveId)" [style]="'flex-shrink:0; width:190px; text-align:left; background:'+child.cardBg+'; border:'+child.cardBorder+'; border-radius:2px; padding:18px 16px; cursor:pointer; display:flex; flex-direction:column; gap:10px; box-shadow:0 1px 3px rgba(0,0,0,0.05);'">
            <div style="width:48px; height:48px; border-radius:50%; background:#EAF5EE; border:1.5px solid #BFE3CD; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <circle cx="13" cy="9" r="4.5" fill="#BFE3CD"/>
                <path d="M3 24c0-5.523 4.477-10 10-10s10 4.477 10 10H3Z" fill="#BFE3CD"/>
              </svg>
            </div>
            <span style="font-family:'Lora',serif; font-weight:700; color:#1c2a20; font-size:14px; line-height:1.3;">{{child.nom}} {{child.prenom}}</span>
            <span style="font-size:12px; color:#5F6161;">{{child.classeLibelle}}</span>
            @if (child.statutBadge) {
              <span [style]="'display:inline-flex; align-self:flex-start; border-radius:20px; padding:3px 9px; font-size:10px; font-weight:700; background:'+child.statutBadge.bg+'; color:'+child.statutBadge.color+';'">
                {{child.statutBadge.label}}
              </span>
            }
            <span [style]="'display:inline-flex; align-self:flex-start; align-items:center; gap:5px; border-radius:20px; padding:3px 9px; font-size:10.5px; font-weight:700; background:'+child.trackBg+'; color:'+child.trackColor+'; border:'+child.trackBorder+';'">{{child.trackLabel}}</span>
          </button>
        }
      </div>

      @if (decoratedSelected(); as sel) {
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:24px; padding-bottom:22px; border-bottom:1px solid #E7E7E5;">
          <h2 style="font-family:'Lora',serif; font-size:22px; color:#1c2a20; margin:0; font-weight:700;">{{sel.nom}} {{sel.prenom}}</h2>
          <span style="font-size:13.5px; color:#5F6161;">{{sel.classeLibelle}}</span>
          <span [style]="'display:inline-flex; align-items:center; gap:5px; border-radius:20px; padding:4px 10px; font-size:11px; font-weight:700; background:'+sel.trackBg+'; color:'+sel.trackColor+'; border:'+sel.trackBorder+';'">{{sel.trackLabel}}</span>
        </div>
      }

      <!-- ══ BANNIÈRE STATUT INSCRIPTION ══════════════════════════════════ -->
      @if (selectedStatutInscription() === 'RESERVEE') {
        <div style="display:flex; align-items:flex-start; gap:12px; background:#FDECE1; border:1px solid #F0C39E; border-radius:2px; padding:14px 18px; margin-bottom:22px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a4416" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#8a4416"/>
          </svg>
          <span style="font-size:13px; color:#8a4416; line-height:1.55;">{{ t('dashboard.inscription.banniereReservee', { prenom: selectedPrenom() }) }}</span>
        </div>
      }

      <!-- ══ ALERTE SOLDE ════════════════════════════════════════════════ -->
      @if (soldeRestant() > 0) {
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; background:#FDECE1; border:1px solid #F0C39E; border-radius:2px; padding:14px 18px; margin-bottom:24px;">
          <span style="font-size:13.5px; color:#8a4416; font-weight:600;">{{ t('dashboard.alerte.solde') }} {{soldeFmt()}}</span>
          <a href="#" (click)="goHistoriqueQuittance($event)" style="color:#E8722C; font-weight:700; font-size:13px; text-decoration:none;">{{ t('dashboard.alerte.voirQuittances') }}</a>
        </div>
      }

      <!-- ══ CARTES SUIVI ════════════════════════════════════════════════ -->
      @if (suiviLoading()) {
        <div style="display:flex; align-items:center; gap:10px; padding:20px 0; color:#5F6161; font-size:13px;">
          <div class="cob-spinner" style="width:20px; height:20px; border-radius:50%; border:2px solid #E7E7E5; border-top-color:#008B47; flex-shrink:0;"></div>
          {{ t('dashboard.suivi.chargement') }}
        </div>
      } @else if (suiviError()) {
        <div style="background:#FDECE1; border:1px solid #F0C39E; border-radius:2px; padding:14px 18px; margin-bottom:22px; font-size:13px; color:#8a4416;">
          {{ t('dashboard.suivi.erreur') }}
        </div>
      } @else {
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:20px; margin-bottom:40px;">

          <!-- Scolarité -->
          <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-top:3px solid #008B47; border-radius:2px; padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:12px;">
            <h3 style="font-family:'Lora',serif; font-size:16px; color:#1c2a20; margin:0; font-weight:700;">{{ t('dashboard.scolarite.titre') }}</h3>
            <div style="display:flex; justify-content:space-between; font-size:13px;"><span style="color:#5F6161;">{{ t('dashboard.scolarite.totalDu') }}</span><span style="font-weight:600; color:#1c2a20;">{{totalFmt()}}</span></div>
            <div style="display:flex; justify-content:space-between; font-size:13px;"><span style="color:#5F6161;">{{ t('dashboard.scolarite.montantVerse') }}</span><span style="font-weight:600; color:#1c2a20;">{{verseFmt()}}</span></div>
            <div style="height:1px; background:#E7E7E5;"></div>
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <span style="font-size:13px; color:#5F6161;">{{ soldeRestant() > 0 ? t('dashboard.scolarite.soldeRestant') : t('dashboard.scolarite.aJour') }}</span>
              <span [style]="'font-family:Lora,serif; font-size:22px; font-weight:700; color:'+soldeColor()+';'">{{soldeFmt()}}</span>
            </div>
            <a href="#" (click)="goHistoriqueQuittance($event)" style="margin-top:4px; text-align:center; border:1.5px solid #008B47; color:#008B47; font-weight:700; font-size:13px; padding:11px; border-radius:2px; text-decoration:none;">{{ t('dashboard.scolarite.voirQuittances') }}</a>
          </div>

          <!-- Résultats -->
          <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-top:3px solid #008B47; border-radius:2px; padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:12px;">
            <h3 style="font-family:'Lora',serif; font-size:16px; color:#1c2a20; margin:0; font-weight:700;">{{ t('dashboard.resultats.titre') }}</h3>
            <span style="font-size:12.5px; color:#5F6161;">{{sequenceLibelle() || t('dashboard.resultats.sequence')}}</span>
            <span style="font-family:'Lora',serif; font-size:34px; font-weight:700; color:#1c2a20; line-height:1;">{{moyenneFmt()}}</span>
            @if (moyenneGenerale() !== null) {
              <span style="display:inline-flex; align-self:flex-start; background:#EAF5EE; color:#008B47; font-size:11.5px; font-weight:700; padding:4px 10px; border-radius:20px;">{{mention()}}</span>
            } @else {
              <span style="display:inline-flex; align-self:flex-start; background:#F0F1EF; color:#5F6161; font-size:11.5px; padding:4px 10px; border-radius:20px;">{{ t('dashboard.resultats.aucune') }}</span>
            }
            <a href="#" (click)="noop($event)" style="margin-top:auto; text-align:center; border:1.5px solid #008B47; color:#008B47; font-weight:700; font-size:13px; padding:11px; border-radius:2px; text-decoration:none; opacity:0.4; cursor:default;">{{ t('dashboard.resultats.voirBulletin') }}</a>
          </div>

          <!-- Discipline -->
          <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-top:3px solid #008B47; border-radius:2px; padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:12px;">
            <h3 style="font-family:'Lora',serif; font-size:16px; color:#1c2a20; margin:0; font-weight:700;">{{ t('dashboard.discipline.titre') }}</h3>
            <span style="font-family:'Lora',serif; font-size:34px; font-weight:700; color:#1c2a20; line-height:1;">{{nbIncidents()}}</span>
            <span style="font-size:12.5px; color:#5F6161;">{{ t('dashboard.discipline.incidents') }}</span>
            <span [style]="'display:inline-flex; align-self:flex-start; background:'+disciplineBg()+'; color:'+disciplineColor()+'; font-size:11.5px; font-weight:700; padding:4px 10px; border-radius:20px;'">
              {{ disciplineStatus() === 'ras' ? t('dashboard.discipline.ras') : t('dashboard.discipline.incidentsSignales') }}
            </span>
          </div>

        </div>
      }

      <!-- ══ HISTORIQUE DES VERSEMENTS ══════════════════════════════════ -->
      <p id="historique" style="text-transform:uppercase; letter-spacing:1.3px; font-size:12px; font-weight:700; color:#E8722C; margin:0 0 16px; scroll-margin-top:80px; border-top:1px solid #E7E7E5; padding-top:32px;">{{ t('dashboard.historique.titre') }}</p>

      @if (historiqueLoading()) {
        <div style="display:flex; align-items:center; gap:10px; padding:14px 0; color:#5F6161; font-size:13px;">
          <div class="cob-spinner" style="width:18px; height:18px; border-radius:50%; border:2px solid #E7E7E5; border-top-color:#008B47; flex-shrink:0;"></div>
          {{ t('dashboard.suivi.chargement') }}
        </div>
      } @else if (historiqueError()) {
        <p style="font-size:13px; color:#C0392B; padding:14px 0; margin:0;">{{ t('dashboard.historique.erreur') }}</p>
      } @else if (versements().length === 0) {
        <p style="font-size:13px; color:#5F6161; padding:14px 0; margin:0;">{{ t('dashboard.historique.aucun') }}</p>
      } @else {
        <div style="display:flex; flex-direction:column; gap:12px;">
          @for (h of versements(); track h.id) {
            <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-radius:2px; padding:20px; display:flex; flex-direction:column; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; flex-direction:column; gap:3px;">
                  <span style="font-family:'Lora',serif; font-weight:700; color:#1c2a20; font-size:15px;">{{formatDate(h.dateVersement)}}</span>
                  <span style="font-size:11px; color:#5F6161; font-family:monospace;">{{ t('dashboard.historique.quittance') }} {{h.numeroQuittance}}</span>
                </div>
                <span style="font-family:'Lora',serif; font-weight:700; color:#008B47; font-size:18px;">{{fmt(h.montant)}}</span>
              </div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:8px; font-size:12.5px; color:#5F6161;">
                <span>{{ t('dashboard.historique.mode') }} <strong style="color:#1c2a20;">{{formatMode(h.modePaiement)}}</strong></span>
                <span>{{ t('dashboard.historique.resteAPayer') }} <strong style="color:#1c2a20;">{{fmt(h.soldeApresVersement)}}</strong></span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding-top:10px; border-top:1px solid #F4EFE4;">
                @if (h.statutValidation === 'VALIDE') {
                  <span style="font-size:11px; font-weight:700; color:#008B47; background:#EAF5EE; padding:3px 10px; border-radius:20px;">{{ t('dashboard.historique.statutValide') }}</span>
                } @else if (h.statutValidation === 'EN_ATTENTE_VALIDATION') {
                  <span style="font-size:11px; font-weight:700; color:#8a4416; background:#FDECE1; padding:3px 10px; border-radius:20px;">{{ t('dashboard.historique.statutAttente') }}</span>
                } @else {
                  <span style="font-size:11px; font-weight:700; color:#C0392B; background:#FDECE1; padding:3px 10px; border-radius:20px;">{{ t('dashboard.historique.statutRejete') }}</span>
                }
                @if (h.statutValidation === 'VALIDE') {
                  <button (click)="downloadPdf(h.id, $event)" [disabled]="!!pdfLoading()"
                    style="background:none; border:none; padding:0; font-size:12.5px; color:#008B47; font-weight:700; cursor:pointer; font-family:'Work Sans',sans-serif;">
                    {{ pdfLoading() === h.id ? t('dashboard.historique.enCours') : t('dashboard.historique.telecharger') }}
                  </button>
                  <a href="#" (click)="goQuittanceDetail(h.id, h.eleveId, selected()?.classeLibelle ?? '', $event)"
                    style="font-size:12.5px; color:#5F6161; text-decoration:none;">
                    {{ t('dashboard.historique.voirApercu') }}
                  </a>
                }
                @if (pdfError() === h.id) {
                  <span style="font-size:11.5px; color:#C0392B;">{{ t('dashboard.historique.erreurPdf') }}</span>
                }
              </div>
            </div>
          }
        </div>
      }

    }
  </main>

</div>
</ng-container>
    `
})
export class ParentDashboard extends CobimagBase {
    private authService    = inject(AuthService);
    private parentService  = inject(ParentDashboardService);
    private transloco      = inject(TranslocoService);
    private langService    = inject(LanguageService);

    // ── Enfants ────────────────────────────────────────────────────────────
    private childrenState = toSignal(
        this.parentService.getMesEnfants().pipe(
            map(data => data),
            catchError(() => of('error' as const))
        )
        // undefined = chargement, 'error' = réseau, EnfantResponse[] = données
    );

    readonly childrenLoading = computed(() => this.childrenState() === undefined);
    readonly childrenError   = computed(() => this.childrenState() === 'error');
    readonly enfants         = computed<EnfantResponse[]>(() => {
        const cs = this.childrenState();
        return Array.isArray(cs) ? cs : [];
    });

    // ── Enfant sélectionné ─────────────────────────────────────────────────
    readonly selectedEleveId = signal<string>('');

    readonly selected = computed<EnfantResponse | null>(() =>
        this.enfants().find(c => c.eleveId === this.selectedEleveId()) ?? null
    );

    readonly decoratedChildren = computed(() => this.enfants().map(c => this.decorate(c)));
    readonly decoratedSelected = computed(() => {
        const s = this.selected();
        return s ? this.decorate(s) : null;
    });

    // ── Suivi (rechargé à chaque changement d'enfant) ─────────────────────
    private suiviState = toSignal<SuiviEleveResponse | 'error'>(
        toObservable(this.selectedEleveId).pipe(
            filter(id => !!id),
            switchMap(id =>
                this.parentService.getSuivi(id).pipe(
                    catchError(() => of('error' as const))
                )
            )
        )
        // undefined = chargement, 'error' = réseau, SuiviEleveResponse = données
    );

    private rawSuivi = computed<SuiviEleveResponse | null>(() => {
        const s = this.suiviState();
        return (s && typeof s !== 'string') ? s : null;
    });

    readonly suiviLoading = computed(() => !!this.selectedEleveId() && this.suiviState() === undefined);
    readonly suiviError   = computed(() => this.suiviState() === 'error');

    // ── Historique versements (rechargé à chaque changement d'enfant) ──────
    private historiqueState = toSignal<VersementResponse[] | 'error'>(
        toObservable(this.selectedEleveId).pipe(
            filter(id => !!id),
            switchMap(id =>
                this.parentService.getHistoriqueVersements(id).pipe(
                    map(page => page.content),
                    catchError(() => of('error' as const))
                )
            )
        )
    );

    readonly historiqueLoading = computed(() => !!this.selectedEleveId() && this.historiqueState() === undefined);
    readonly historiqueError   = computed(() => this.historiqueState() === 'error');
    readonly versements = computed<VersementResponse[]>(() => {
        const h = this.historiqueState();
        return Array.isArray(h) ? h : [];
    });

    // ── Computed scolarité ─────────────────────────────────────────────────
    readonly solde       = computed(() => this.rawSuivi()?.solde ?? null);
    readonly totalFmt    = computed(() => this.solde() ? formatXAF(this.solde()!.tauxScolarite) : '—');
    readonly verseFmt    = computed(() => this.solde() ? formatXAF(this.solde()!.totalVerse) : '—');
    readonly soldeFmt    = computed(() => this.solde() ? formatXAF(this.solde()!.soldeRestant) : '—');
    readonly soldeRestant = computed(() => this.solde()?.soldeRestant ?? 0);
    readonly soldeColor  = computed(() => this.soldeRestant() > 0 ? '#C0392B' : '#008B47');

    // ── Computed résultats ─────────────────────────────────────────────────
    readonly sequenceLibelle  = computed(() => this.rawSuivi()?.sequenceLibelle ?? '');
    readonly moyenneGenerale  = computed<number | null>(() => this.rawSuivi()?.moyennes.moyenneGenerale ?? null);
    readonly moyenneFmt = computed(() => {
        const m = this.moyenneGenerale();
        return m !== null ? m.toFixed(1) + '/20' : '—';
    });
    readonly mention = computed(() => {
        void this.langService.currentLang();
        const m = this.moyenneGenerale();
        if (m === null) return '—';
        const t = (k: string) => this.transloco.translate('parent.dashboard.mention.' + k);
        if (m >= 16) return t('tresBien');
        if (m >= 14) return t('bien');
        if (m >= 12) return t('assezBien');
        if (m >= 10) return t('passable');
        return t('insuffisant');
    });

    // ── Computed discipline ────────────────────────────────────────────────
    readonly nbIncidents      = computed(() => (this.rawSuivi()?.sanctions ?? []).length);
    readonly disciplineStatus = computed(() => this.nbIncidents() === 0 ? 'ras' : 'minor');
    readonly disciplineBg     = computed(() => this.disciplineStatus() === 'ras' ? '#EAF5EE' : '#FDECE1');
    readonly disciplineColor  = computed(() => this.disciplineStatus() === 'ras' ? '#008B47' : '#E8722C');

    // ── Statut inscription de l'enfant sélectionné ───────────────────────
    readonly selectedPrenom             = computed(() => this.selected()?.prenom ?? '');
    readonly selectedStatutInscription  = computed(() => this.selected()?.statutInscription ?? null);

    // ── Données parent ─────────────────────────────────────────────────────
    parentDisplayName = computed(() => this.authService.currentUser()?.sub ?? '');

    // ── PDF download ───────────────────────────────────────────────────────
    readonly pdfLoading = signal<string | null>(null);
    readonly pdfError   = signal<string | null>(null);

    constructor() {
        super();
        // Auto-sélection du premier enfant au chargement
        effect(() => {
            const cs = this.childrenState();
            if (Array.isArray(cs) && cs.length > 0 && !this.selectedEleveId()) {
                this.selectedEleveId.set(cs[0].eleveId);
            }
        });
    }

    selectChild(eleveId: string): void { this.selectedEleveId.set(eleveId); }

    onDeconnexion(e: Event): void {
        e.preventDefault();
        this.authService.logout();
    }

    reload(e: Event): void {
        e.preventDefault();
        if (typeof window !== 'undefined') window.location.reload();
    }

    goHistoriqueQuittance(e: Event): void {
        e.preventDefault();
        if (typeof document !== 'undefined')
            document.getElementById('historique')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    downloadPdf(versementId: string, e: Event): void {
        e.preventDefault();
        if (this.pdfLoading()) return;
        this.pdfError.set(null);
        this.pdfLoading.set(versementId);
        this.parentService.downloadQuittancePdf(versementId).pipe(
            take(1),
            catchError(() => of(null))
        ).subscribe(blob => {
            this.pdfLoading.set(null);
            if (!blob) {
                this.pdfError.set(versementId);
                return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quittance-${versementId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    fmt(n: number): string { return formatXAF(n); }

    formatDate(dateVersement: string): string {
        return new Date(dateVersement).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }

    formatMode(mode: 'CAISSE' | 'VALIDATION_BANCAIRE'): string {
        void this.langService.currentLang();
        const k = mode === 'CAISSE' ? 'caisse' : 'bancaire';
        return this.transloco.translate('parent.dashboard.modePaiement.' + k);
    }

    private decorate(c: EnfantResponse) {
        void this.langService.currentLang();
        const track = this.inferTrack(c.classeLibelle);
        const isFr  = track === 'fr';
        const isSel = c.eleveId === this.selectedEleveId();
        const tl = (k: string) => this.transloco.translate('parent.dashboard.track.' + k);
        const ti = (k: string) => this.transloco.translate('parent.dashboard.inscription.' + k);
        const statutBadge = c.statutInscription === 'RESERVEE'
            ? { bg: '#FDECE1', color: '#8a4416', label: ti('reservee') }
            : c.statutInscription === 'ANNULEE'
            ? { bg: '#F0F1EF', color: '#C0392B', label: ti('annulee') }
            : null;
        return {
            ...c,
            trackLabel:  isFr ? tl('francophone') : tl('anglophone'),
            cardBg:      isSel ? '#EAF5EE' : '#FFFFFF',
            cardBorder:  isSel ? '1.5px solid #008B47' : '1px solid #E7E7E5',
            trackBg:     isFr  ? '#008B47' : '#FFFFFF',
            trackColor:  isFr  ? '#FFFFFF' : '#008B47',
            trackBorder: isFr  ? 'none'    : '1.5px solid #008B47',
            statutBadge,
        };
    }

    private inferTrack(classeLibelle: string): 'fr' | 'en' {
        const l = classeLibelle.toLowerCase();
        return l.startsWith('form') || l.includes('sixth') || l.includes('upper') || l.includes('lower') ? 'en' : 'fr';
    }
}
