import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { EtablissementService } from '@/app/core/services/etablissement.service';
import { LanguageSwitcher } from '@/app/shared/components/language-switcher/language-switcher';
import {
    VitrineService,
    ContenuVitrineResponse,
    ActualiteResponse,
    MembreEquipePedagogiqueResponse,
    PageResponse
} from '@/app/core/services/vitrine.service';
import { CobimagBase } from '@/app/shared/cobimag-base';
import {
    CYCLES, SYSTEM_FR, SYSTEM_EN, STATS, PRESENTATION, VIE_SCOLAIRE, NEWS, STEPS,
    SystemData
} from '@/app/data/vitrine.data';

// Zéro import PrimeNG — ADR-011.
// Design fidèle à reference/angular-demo/landing.component.html.
// Texte via Transloco scope 'vitrine' — ADR-012.
@Component({
    selector: 'app-vitrine',
    standalone: true,
    imports: [TranslocoDirective, LanguageSwitcher],
    template: `
<ng-container *transloco="let t; scope: 'vitrine'; prefix: 'vitrine'">
<div style="font-family:'Work Sans',sans-serif; color:#5F6161; background:#FFFFFF; overflow-x:clip; line-height:1.55;">

<!-- ══ HEADER ═════════════════════════════════════════════════════════════ -->
<header style="position:sticky; top:0; z-index:50; background:#FFFFFF; box-shadow:0 1px 0 rgba(0,0,0,0.08);">
  <!-- Barre de contact : se replie après 80 px de scroll -->
  <div [style]="topbarStyle()">
    <div style="display:flex; gap:18px; flex-wrap:wrap;">
      <span>{{ t('topbar.adresse') }}</span>
      <span>{{ t('topbar.telephone') }}</span>
      <span>{{ t('topbar.email') }}</span>
    </div>
    <div style="display:flex; gap:8px; align-items:center; font-weight:600;">
      <span style="display:inline-flex; align-items:center;">
        <span style="width:18px;height:18px;border-radius:50%;background:#FFFFFF;color:#008B47;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;">FR</span>
        <span style="width:18px;height:18px;border-radius:50%;border:1.5px solid #FFFFFF;color:#FFFFFF;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-left:-6px;">EN</span>
      </span>
      <span>{{ t('topbar.bilingue') }}</span>
    </div>
  </div>

  <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 24px; gap:16px; flex-wrap:nowrap;">
    <a href="#accueil" (click)="scrollTo($event,'accueil')" style="display:flex; align-items:center; gap:10px; color:#1c2a20; min-width:0; overflow:hidden; text-decoration:none; cursor:pointer;">
      <img [src]="displayLogoUrl()" [attr.width]="logoHeaderSize" [attr.height]="logoHeaderSize" alt="Logo COBIMAG" style="flex-shrink:0; border-radius:50%; object-fit:cover;">
      <span style="display:flex; flex-direction:column; line-height:1.2; min-width:0;">
        <span style="font-family:'Lora',serif; font-weight:700; font-size:16px; color:#1c2a20; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ nom() }}</span>
        @if (showSubtitle) {
          <span style="font-size:11px; font-style:italic; color:#5F6161; letter-spacing:0.3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Marie Gisèle Bilingual College   </span>
        }
      </span>
    </a>

    @if (!isMobile) {
      <nav style="display:flex; gap:20px; align-items:center; flex:1; min-width:0; overflow-x:auto; white-space:nowrap;">
        <a href="#accueil"     (click)="scrollTo($event,'accueil')"     style="color:#1c2a20; font-weight:600; font-size:14px; text-decoration:none; cursor:pointer;">{{ t('nav.accueil') }}</a>
        <a href="#ecole"       (click)="scrollTo($event,'ecole')"       style="color:#1c2a20; font-weight:600; font-size:14px; text-decoration:none; cursor:pointer;">{{ t('nav.ecole') }}</a>
        <a href="#formations"  (click)="scrollTo($event,'formations')"  style="color:#1c2a20; font-weight:600; font-size:14px; text-decoration:none; cursor:pointer;">{{ t('nav.formations') }}</a>
        <a href="#vie-scolaire" (click)="scrollTo($event,'vie-scolaire')" style="color:#1c2a20; font-weight:600; font-size:14px; text-decoration:none; cursor:pointer;">{{ t('nav.vieScolaire') }}</a>
        <a href="#actualites"  (click)="scrollTo($event,'actualites')"  style="color:#1c2a20; font-weight:600; font-size:14px; text-decoration:none; cursor:pointer;">{{ t('nav.actualites') }}</a>
        <a href="#admissions" (click)="scrollTo($event,'admissions')" style="color:#1c2a20; font-weight:600; font-size:14px; text-decoration:none; cursor:pointer;">{{ t('nav.admissions') }}</a>
        <a href="#contact"     (click)="scrollTo($event,'contact')"     style="color:#1c2a20; font-weight:600; font-size:14px; text-decoration:none; cursor:pointer;">{{ t('nav.contact') }}</a>
      </nav>
    }

    <div style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
      <a href="#" (click)="goConnexion($event)" style="background:#E8722C; color:#FFFFFF; font-weight:700; font-size:14px; padding:11px 20px; border-radius:2px; white-space:nowrap; text-decoration:none;">{{ t('accueil.cta.inscrire') }}</a>
      @if (isMobile) {
        <button (click)="toggleMobileMenu()" aria-label="Menu" style="background:none; border:1.5px solid #5F6161; border-radius:2px; width:40px; height:40px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; cursor:pointer;">
          <span style="width:18px; height:2px; background:#1c2a20;"></span>
          <span style="width:18px; height:2px; background:#1c2a20;"></span>
          <span style="width:18px; height:2px; background:#1c2a20;"></span>
        </button>
      }
      <app-language-switcher variant="light" />
    </div>
  </div>

  @if (isMobile && mobileMenuOpen()) {
    <nav style="display:flex; flex-direction:column; padding:8px 24px 18px; border-top:1px solid #eee;">
      <a href="#accueil"     (click)="scrollTo($event,'accueil');    closeMobileMenu()" style="color:#1c2a20; font-weight:600; font-size:15px; padding:10px 0; border-bottom:1px solid #f2f2f2; text-decoration:none; cursor:pointer;">{{ t('nav.accueil') }}</a>
      <a href="#ecole"       (click)="scrollTo($event,'ecole');       closeMobileMenu()" style="color:#1c2a20; font-weight:600; font-size:15px; padding:10px 0; border-bottom:1px solid #f2f2f2; text-decoration:none; cursor:pointer;">{{ t('nav.ecole') }}</a>
      <a href="#formations"  (click)="scrollTo($event,'formations');  closeMobileMenu()" style="color:#1c2a20; font-weight:600; font-size:15px; padding:10px 0; border-bottom:1px solid #f2f2f2; text-decoration:none; cursor:pointer;">{{ t('nav.formations') }}</a>
      <a href="#vie-scolaire" (click)="scrollTo($event,'vie-scolaire'); closeMobileMenu()" style="color:#1c2a20; font-weight:600; font-size:15px; padding:10px 0; border-bottom:1px solid #f2f2f2; text-decoration:none; cursor:pointer;">{{ t('nav.vieScolaire') }}</a>
      <a href="#actualites"  (click)="scrollTo($event,'actualites');  closeMobileMenu()" style="color:#1c2a20; font-weight:600; font-size:15px; padding:10px 0; border-bottom:1px solid #f2f2f2; text-decoration:none; cursor:pointer;">{{ t('nav.actualites') }}</a>
      <a href="#admissions" (click)="scrollTo($event,'admissions'); closeMobileMenu()" style="color:#1c2a20; font-weight:600; font-size:15px; padding:10px 0; border-bottom:1px solid #f2f2f2; text-decoration:none; cursor:pointer;">{{ t('nav.admissions') }}</a>
      <a href="#contact"     (click)="scrollTo($event,'contact');     closeMobileMenu()" style="color:#1c2a20; font-weight:600; font-size:15px; padding:10px 0; border-bottom:1px solid #f2f2f2; text-decoration:none; cursor:pointer;">{{ t('nav.contact') }}</a>
      <a href="#" (click)="goConnexion($event); closeMobileMenu()" style="margin-top:10px; text-align:center; background:#008B47; color:#FFFFFF; font-weight:700; font-size:14px; padding:12px; border-radius:3px; text-decoration:none;">{{ t('nav.espaceParent') }}</a>
    </nav>
  }
</header>

<!-- ══ SECTION ACCUEIL (hero sombre) ═════════════════════════════════════ -->
<section id="accueil" style="scroll-margin-top:110px; position:relative; min-height:600px; display:flex; align-items:flex-end; overflow:hidden;">
  <div style="position:absolute; inset:0; background:#00532B;"></div>
  <div style="position:absolute; inset:0; background-image:repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 22px);"></div>
  <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,40,20,0.1) 0%, rgba(0,30,16,0.9) 100%);"></div>

  <div style="position:relative; z-index:2; padding:72px 24px 44px; max-width:880px; color:#FFFFFF;">
    <div style="display:inline-flex; align-items:center; gap:10px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.3); border-radius:30px; padding:6px 14px 6px 8px; margin-bottom:22px;">
      <span style="display:inline-flex; align-items:center;">
        <span style="width:20px;height:20px;border-radius:50%;background:#008B47;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;">FR</span>
        <span style="width:20px;height:20px;border-radius:50%;border:1.5px solid #FFFFFF;color:#FFFFFF;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-left:-7px;">EN</span>
      </span>
      <span style="font-size:12.5px; font-weight:600; letter-spacing:0.3px;">{{ t('accueil.badge') }}</span>
    </div>
    <h1 style="font-family:'Lora',serif; font-weight:700; font-size:clamp(34px,6vw,60px); margin:0 0 18px; line-height:1.08;">{{ t('accueil.mot1') }} {{ t('accueil.mot2') }} {{ t('accueil.mot3') }}</h1>
    <p style="font-size:clamp(15px,2vw,18px); max-width:600px; margin:0 0 30px; color:rgba(255,255,255,0.9);">{{ t('accueil.description') }}</p>
    <div style="display:flex; gap:14px; flex-wrap:wrap;">
      <a href="#" (click)="goConnexion($event)" style="background:#E8722C; color:#FFFFFF; font-weight:700; font-size:15px; padding:14px 26px; border-radius:2px; text-decoration:none;">{{ t('accueil.cta.inscrire') }}</a>
      <a href="#ecole" (click)="scrollTo($event,'ecole')" style="border:1.5px solid rgba(255,255,255,0.6); color:#FFFFFF; font-weight:600; font-size:15px; padding:14px 26px; border-radius:2px; text-decoration:none; cursor:pointer;">{{ t('accueil.cta.decouvrir') }}</a>
    </div>
  </div>
</section>

<!-- ══ DEUX SOUS-SYSTÈMES ════════════════════════════════════════════════ -->
<section style="padding:56px 24px 64px; background:#FFFFFF;">
  <div style="max-width:1180px; margin:0 auto;">
    <p style="text-align:center; text-transform:uppercase; letter-spacing:1.5px; font-size:12.5px; font-weight:700; color:#E8722C; margin:0 0 8px;">{{ t('sousSystemes.surtitle') }}</p>
    <h2 style="text-align:center; font-family:'Lora',serif; font-size:clamp(24px,3.4vw,34px); color:#1c2a20; margin:0 0 40px; font-weight:600;">{{ t('sousSystemes.titre') }}</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
      @for (system of systems; track $index) {
        <div [style]="'background:'+system.bg+'; color:'+system.color+'; border:'+system.border+'; border-radius:4px; padding:34px 30px; display:flex; flex-direction:column; gap:14px;'">
          <div style="display:flex; align-items:center; gap:10px;">
            <span [style]="'width:34px;height:34px;border-radius:50%;background:'+system.badgeBg+';color:'+system.badgeColor+';font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;'">{{system.badge}}</span>
            <span style="font-size:12.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; opacity:0.75;">{{system.subtitle}}</span>
          </div>
          <h3 style="font-family:'Lora',serif; font-size:24px; margin:0; font-weight:700;">{{system.title}}</h3>
          <p style="margin:0; font-size:14.5px; opacity:0.92;">{{system.desc}}</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
            @for (tag of system.tags; track $index) {
              <span [style]="'border:1px solid '+system.tagBorder+'; border-radius:20px; padding:5px 12px; font-size:12px; font-weight:600; white-space:nowrap;'">{{tag}}</span>
            }
          </div>
        </div>
      }
    </div>
  </div>
</section>

<!-- ══ STATS ═════════════════════════════════════════════════════════════ -->
<section style="background:#008B47; padding:44px 24px;">
  <div style="max-width:1180px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:28px; text-align:center;">
    @for (stat of stats; track $index) {
      <div>
        <div style="font-family:'Lora',serif; font-size:clamp(30px,4vw,44px); font-weight:700; color:#FFFFFF;">{{stat.value}}</div>
        <div style="color:rgba(255,255,255,0.85); font-size:13.5px; margin-top:6px;">{{stat.label}}</div>
      </div>
    }
  </div>
</section>

<!-- ══ ÉCOLE ═════════════════════════════════════════════════════════════ -->
<section id="ecole" style="scroll-margin-top:110px; padding:72px 24px; background:#F7F8F6;">
  <div style="max-width:1180px; margin:0 auto;">

    <!-- Mot du fondateur -->
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
      <span style="display:inline-flex; align-items:center;">
        <span style="width:18px;height:18px;border-radius:50%;background:#008B47;color:#fff;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;">FR</span>
        <span style="width:18px;height:18px;border-radius:50%;border:1.5px solid #008B47;color:#008B47;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-left:-6px;background:#F7F8F6;">EN</span>
      </span>
      <p style="text-transform:uppercase; letter-spacing:1.5px; font-size:12.5px; font-weight:700; color:#E8722C; margin:0;">{{ t('ecole.motFondateur.surtitle') }}</p>
    </div>
    <div style="display:flex; gap:44px; flex-wrap:wrap; align-items:center; margin-bottom:72px;">
      <div style="flex:1; min-width:240px; max-width:320px; aspect-ratio:4/5; border-radius:4px; background:repeating-linear-gradient(45deg, rgba(232,114,44,0.08) 0px, rgba(232,114,44,0.08) 10px, transparent 10px, transparent 20px), #EDEEEC; display:flex; align-items:center; justify-content:center; padding:16px; text-align:center;">
        <span style="font-family:monospace; font-size:12px; color:#5F6161;">PHOTO</span>
      </div>
      <div style="flex:2; min-width:300px;">
        <span style="font-family:'Lora',serif; font-size:56px; color:#E8722C; line-height:0.4; display:block; margin-bottom:6px;">"</span>
        <p style="font-family:'Lora',serif; font-style:italic; font-size:clamp(18px,2.4vw,24px); color:#1c2a20; margin:0 0 20px; line-height:1.4;">
          @if (contenuMotFondateur()?.contenu) {
            {{ contenuMotFondateur()!.contenu }}
          } @else {
            {{ t('ecole.motFondateur.citation') }}
          }
        </p>
        <p style="font-weight:700; color:#1c2a20; margin:0;">{{ t('ecole.motFondateur.fondatriceNom') }}</p>
        <p style="margin:2px 0 0; font-size:13.5px; color:#5F6161;">{{ t('ecole.motFondateur.fondatriceRole') }}</p>
      </div>
    </div>

    <!-- Présentation -->
    <p style="text-transform:uppercase; letter-spacing:1.5px; font-size:12.5px; font-weight:700; color:#E8722C; margin:0 0 8px;">{{ t('ecole.presentation.surtitle') }}</p>
    <h2 style="font-family:'Lora',serif; font-size:clamp(24px,3.4vw,32px); color:#1c2a20; margin:0 0 32px; font-weight:600;">{{ t('ecole.presentation.titre') }}</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:22px;">
      @for (block of presentation; track $index) {
        <div style="background:#FFFFFF; border-top:3px solid #008B47; border-radius:2px; padding:26px 22px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <h3 style="font-family:'Lora',serif; font-size:18px; color:#1c2a20; margin:0 0 10px; font-weight:700;">{{block.title}}</h3>
          <p style="font-size:14px; margin:0;">{{block.text}}</p>
        </div>
      }
    </div>

    <!-- Équipe pédagogique (API) -->
    @if (equipe().length > 0) {
      <div style="margin-top:56px;">
        <h3 style="font-family:'Lora',serif; font-size:clamp(18px,2.5vw,22px); color:#1c2a20; margin:0 0 32px; font-weight:600; text-align:center;">{{ t('ecole.equipe.titre') }}</h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:20px;">
          @for (membre of equipe(); track membre.id) {
            <div style="background:#FFFFFF; border-radius:2px; padding:28px 20px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              @if (membre.photoUrl) {
                <img [src]="membre.photoUrl" [alt]="membre.nom" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin:0 auto 14px; display:block;">
              } @else {
                <div style="width:80px; height:80px; border-radius:50%; background:#EAF5EE; margin:0 auto 14px; display:flex; align-items:center; justify-content:center;">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="13" r="7" fill="#BFE3CD"/>
                    <path d="M4 34c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#BFE3CD"/>
                  </svg>
                </div>
              }
              <div style="font-family:'Lora',serif; font-weight:700; font-size:14px; color:#1c2a20; margin-bottom:5px;">{{ membre.nom }}</div>
              <div style="font-size:12.5px; color:#5F6161; line-height:1.4;">{{ membre.fonction }}</div>
            </div>
          }
        </div>
      </div>
    }
  </div>
</section>

<!-- ══ FORMATIONS ════════════════════════════════════════════════════════ -->
<section id="formations" style="scroll-margin-top:110px; padding:72px 24px; background:#FFFFFF;">
  <div style="max-width:1180px; margin:0 auto;">
    <p style="text-transform:uppercase; letter-spacing:1.5px; font-size:12.5px; font-weight:700; color:#E8722C; margin:0 0 8px;">{{ t('formations.surtitle') }}</p>
    <h2 style="font-family:'Lora',serif; font-size:clamp(24px,3.4vw,32px); color:#1c2a20; margin:0 0 36px; font-weight:600;">{{ t('formations.titre') }}</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
      @for (cycle of cycles; track $index) {
        <div style="border:1px solid #E7E7E5; border-radius:4px; padding:28px 24px; display:flex; flex-direction:column; gap:16px;">
          <div>
            <span style="font-size:11px; font-weight:700; letter-spacing:1px; color:#008B47;">{{ t('formations.sections.francophone') }}</span>
            <h3 style="font-family:'Lora',serif; font-size:20px; color:#1c2a20; margin:4px 0 2px; font-weight:700;">{{cycle.fr}}</h3>
            <p style="margin:0; font-size:14px; color:#5F6161; font-weight:600;">{{cycle.frClasses}}</p>
          </div>
          <div style="height:1px; background:#EEEEEC;"></div>
          <div>
            <span style="font-size:11px; font-weight:700; letter-spacing:1px; color:#5F6161;">{{ t('formations.sections.anglophone') }}</span>
            <h3 style="font-family:'Lora',serif; font-size:20px; color:#1c2a20; margin:4px 0 2px; font-weight:700;">{{cycle.en}}</h3>
            <p style="margin:0; font-size:14px; color:#5F6161; font-weight:600;">{{cycle.enClasses}}</p>
          </div>
          <p style="margin:4px 0 0; font-size:13.5px; color:#5F6161;">{{cycle.desc}}</p>
        </div>
      }
    </div>
  </div>
</section>

<!-- ══ VIE SCOLAIRE ══════════════════════════════════════════════════════ -->
<section id="vie-scolaire" style="scroll-margin-top:110px; padding:72px 24px; background:#F7F8F6;">
  <div style="max-width:1180px; margin:0 auto;">
    <p style="text-transform:uppercase; letter-spacing:1.5px; font-size:12.5px; font-weight:700; color:#E8722C; margin:0 0 8px;">{{ t('vieScolaire.surtitle') }}</p>
    <h2 style="font-family:'Lora',serif; font-size:clamp(24px,3.4vw,32px); color:#1c2a20; margin:0 0 36px; font-weight:600;">{{ t('vieScolaire.titre') }}</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:24px;">

      <!-- Horaires (API ou statique) -->
      <div style="background:#FFFFFF; border-radius:4px; padding:26px 24px;">
        <h3 style="font-family:'Lora',serif; font-size:18px; color:#1c2a20; margin:0 0 16px; font-weight:700;">{{ t('vieScolaire.horaires.titre') }}</h3>
        @if (contenuHoraires()?.contenu) {
          <p style="font-size:14px; line-height:1.75; white-space:pre-line; margin:0;">{{ contenuHoraires()!.contenu }}</p>
        } @else {
          <div style="display:flex; flex-direction:column; gap:10px;">
            @for (item of vieScolaireHorairesItems; track $index) {
              <div style="display:flex; gap:10px; font-size:14px; align-items:flex-start;">
                <span style="width:6px; height:6px; border-radius:50%; background:#E8722C; margin-top:7px; flex-shrink:0;"></span>
                <span>{{item}}</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Activités périscolaires (API ou statique) -->
      <div style="background:#FFFFFF; border-radius:4px; padding:26px 24px;">
        <h3 style="font-family:'Lora',serif; font-size:18px; color:#1c2a20; margin:0 0 16px; font-weight:700;">{{ t('vieScolaire.activites.titre') }}</h3>
        @if (contenuActivites()?.contenu) {
          <p style="font-size:14px; line-height:1.75; white-space:pre-line; margin:0;">{{ contenuActivites()!.contenu }}</p>
        } @else {
          <div style="display:flex; flex-direction:column; gap:10px;">
            @for (item of vieScolaireActivitesItems; track $index) {
              <div style="display:flex; gap:10px; font-size:14px; align-items:flex-start;">
                <span style="width:6px; height:6px; border-radius:50%; background:#E8722C; margin-top:7px; flex-shrink:0;"></span>
                <span>{{item}}</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Cantine & Transport (toujours statique) -->
      <div style="background:#FFFFFF; border-radius:4px; padding:26px 24px;">
        <h3 style="font-family:'Lora',serif; font-size:18px; color:#1c2a20; margin:0 0 16px; font-weight:700;">{{ t('vieScolaire.cantine.titre') }}</h3>
        <div style="display:flex; flex-direction:column; gap:10px;">
          @for (item of vieScolaireCantineItems; track $index) {
            <div style="display:flex; gap:10px; font-size:14px; align-items:flex-start;">
              <span style="width:6px; height:6px; border-radius:50%; background:#E8722C; margin-top:7px; flex-shrink:0;"></span>
              <span>{{item}}</span>
            </div>
          }
        </div>
      </div>

    </div>
  </div>
</section>

<!-- ══ ACTUALITÉS ════════════════════════════════════════════════════════ -->
<section id="actualites" style="scroll-margin-top:110px; padding:72px 24px; background:#FFFFFF;">
  <div style="max-width:1180px; margin:0 auto;">
    <p style="text-transform:uppercase; letter-spacing:1.5px; font-size:12.5px; font-weight:700; color:#E8722C; margin:0 0 8px;">{{ t('actualites.surtitle') }}</p>
    <h2 style="font-family:'Lora',serif; font-size:clamp(24px,3.4vw,32px); color:#1c2a20; margin:0 0 36px; font-weight:600;">{{ t('actualites.titre') }}</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">

      @if (actualites()?.content?.length) {
        @for (actu of actualites()!.content; track actu.id) {
          <div style="border:1px solid #E7E7E5; border-radius:4px; overflow:hidden; display:flex; flex-direction:column;">
            <div style="aspect-ratio:16/10; background:repeating-linear-gradient(45deg, rgba(0,139,71,0.08) 0px, rgba(0,139,71,0.08) 10px, transparent 10px, transparent 20px), #F0F1EF; display:flex; align-items:center; justify-content:center; padding:14px; text-align:center;">
              @if (actu.imageUrl) {
                <img [src]="actu.imageUrl" [alt]="actu.titre" style="width:100%; height:100%; object-fit:cover;">
              }
            </div>
            <div style="padding:20px; display:flex; flex-direction:column; gap:8px; flex:1;">
              <div style="display:flex; gap:10px; align-items:center;">
                <span style="background:#FDECE1; color:#E8722C; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px;">{{ t('actualites.badge') }}</span>
                <span style="font-size:12px; color:#5F6161;">{{ formatDate(actu.datePublication) }}</span>
              </div>
              <h3 style="font-family:'Lora',serif; font-size:17px; color:#1c2a20; margin:0; font-weight:700; line-height:1.3;">{{actu.titre}}</h3>
              <p style="font-size:13.5px; margin:0; flex:1;">{{ excerpt(actu.contenu) }}</p>
              <a href="#" (click)="goArticle(actu.id, $event)" style="color:#008B47; font-weight:700; font-size:13.5px; margin-top:4px; text-decoration:none;">{{ t('actualites.lireSuite') }}</a>
            </div>
          </div>
        }
      } @else {
        @for (item of news; track $index) {
          <div style="border:1px solid #E7E7E5; border-radius:4px; overflow:hidden; display:flex; flex-direction:column;">
            <div style="aspect-ratio:16/10; background:repeating-linear-gradient(45deg, rgba(0,139,71,0.08) 0px, rgba(0,139,71,0.08) 10px, transparent 10px, transparent 20px), #F0F1EF; display:flex; align-items:center; justify-content:center; padding:14px; text-align:center;">
              <span style="font-family:monospace; font-size:11.5px; color:#5F6161;">PHOTO — {{item.tag}}</span>
            </div>
            <div style="padding:20px; display:flex; flex-direction:column; gap:8px; flex:1;">
              <div style="display:flex; gap:10px; align-items:center;">
                <span style="background:#FDECE1; color:#E8722C; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px;">{{item.tag}}</span>
                <span style="font-size:12px; color:#5F6161;">{{item.date}}</span>
              </div>
              <h3 style="font-family:'Lora',serif; font-size:17px; color:#1c2a20; margin:0; font-weight:700; line-height:1.3;">{{item.title}}</h3>
              <p style="font-size:13.5px; margin:0; flex:1;">{{item.excerpt}}</p>
              <a href="#" (click)="noop($event)" style="color:#008B47; font-weight:700; font-size:13.5px; margin-top:4px; text-decoration:none; opacity:0.45; cursor:default;">{{ t('actualites.lireSuite') }}</a>
            </div>
          </div>
        }
      }

    </div>
  </div>
</section>

<!-- ══ ADMISSIONS ════════════════════════════════════════════════════════ -->
<section id="admissions" style="scroll-margin-top:110px; padding:72px 24px; background:#00532B;">
  <div style="max-width:1180px; margin:0 auto;">
    <p style="text-transform:uppercase; letter-spacing:1.5px; font-size:12.5px; font-weight:700; color:#E8722C; margin:0 0 8px;">{{ t('admissions.surtitle') }}</p>
    <h2 style="font-family:'Lora',serif; font-size:clamp(24px,3.4vw,32px); color:#FFFFFF; margin:0 0 40px; font-weight:600;">{{ t('admissions.titre') }}</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:24px; margin-bottom:36px;">
      @for (step of steps; track $index) {
        <div>
          <div style="width:44px; height:44px; border-radius:50%; background:#E8722C; color:#FFFFFF; font-family:'Lora',serif; font-weight:700; font-size:18px; display:flex; align-items:center; justify-content:center; margin-bottom:14px;">{{step.n}}</div>
          <h3 style="font-family:'Lora',serif; font-size:17px; color:#FFFFFF; margin:0 0 8px; font-weight:700;">{{step.title}}</h3>
          <p style="font-size:13.5px; color:rgba(255,255,255,0.75); margin:0;">{{step.text}}</p>
        </div>
      }
    </div>
    @if (contenuAdmissions()?.contenu) {
      <p style="font-size:15px; color:rgba(255,255,255,0.85); margin:0 0 28px; white-space:pre-line;">{{ contenuAdmissions()!.contenu }}</p>
    }
    <a href="#" (click)="goConnexion($event)" style="display:inline-block; background:#E8722C; color:#FFFFFF; font-weight:700; font-size:15px; padding:15px 30px; border-radius:2px; text-decoration:none;">{{ t('admissions.demarrer') }}</a>
  </div>
</section>

<!-- ══ FOOTER ════════════════════════════════════════════════════════════ -->
<footer id="contact" style="scroll-margin-top:80px; background:#0F1F16; color:rgba(255,255,255,0.75); padding:56px 24px 24px;">
  <div style="max-width:1180px; margin:0 auto;">
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:36px; padding-bottom:36px; border-bottom:1px solid rgba(255,255,255,0.1);">

      <div>
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
          <img [src]="displayLogoUrl()" width="42" height="42" alt="Logo COBIMAG" style="flex-shrink:0; border-radius:50%; object-fit:cover;">
          <span style="display:flex; flex-direction:column; line-height:1.2;">
            <span style="font-family:'Lora',serif; font-weight:700; font-size:15px; color:#FFFFFF;">{{ nom() }}</span>
            <span style="font-size:11px; font-style:italic; color:rgba(255,255,255,0.6);">Marie Gisèle Bilingual College</span>
          </span>
        </div>
        <p style="font-size:13.5px; margin:0 0 6px;">{{ t('topbar.adresse') }}</p>
        <p style="font-size:13.5px; margin:0 0 6px;">{{ t('topbar.telephone') }}</p>
        <p style="font-size:13.5px; margin:0;">{{ t('topbar.email') }}</p>
      </div>

      <div>
        <h4 style="color:#FFFFFF; font-size:14px; font-weight:700; margin:0 0 16px; letter-spacing:0.3px;">{{ t('footer.liensRapides') }}</h4>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:13.5px;">
          <a href="#ecole"        (click)="scrollTo($event,'ecole')"        style="color:rgba(255,255,255,0.75); text-decoration:none; cursor:pointer;">{{ t('nav.ecole') }}</a>
          <a href="#formations"   (click)="scrollTo($event,'formations')"   style="color:rgba(255,255,255,0.75); text-decoration:none; cursor:pointer;">{{ t('nav.formations') }}</a>
          <a href="#vie-scolaire" (click)="scrollTo($event,'vie-scolaire')" style="color:rgba(255,255,255,0.75); text-decoration:none; cursor:pointer;">{{ t('nav.vieScolaire') }}</a>
          <a href="#actualites"   (click)="scrollTo($event,'actualites')"   style="color:rgba(255,255,255,0.75); text-decoration:none; cursor:pointer;">{{ t('nav.actualites') }}</a>
          <a href="#admissions"   (click)="scrollTo($event,'admissions')"   style="color:rgba(255,255,255,0.75); text-decoration:none; cursor:pointer;">{{ t('nav.admissions') }}</a>
        </div>
      </div>

      <div>
        <h4 style="color:#FFFFFF; font-size:14px; font-weight:700; margin:0 0 16px; letter-spacing:0.3px;">{{ t('footer.reseauxSociaux') }}</h4>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:13.5px;">
          <a href="#" (click)="noop($event)" style="color:rgba(255,255,255,0.75); text-decoration:none;">Facebook</a>
          <a href="#" (click)="noop($event)" style="color:rgba(255,255,255,0.75); text-decoration:none;">Instagram</a>
          <a href="#" (click)="noop($event)" style="color:rgba(255,255,255,0.75); text-decoration:none;">LinkedIn</a>
          <a href="#" (click)="noop($event)" style="color:rgba(255,255,255,0.75); text-decoration:none;">YouTube</a>
        </div>
      </div>

    </div>

    <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; padding-top:20px; font-size:12.5px; align-items:center;">
      <span>© {{currentYear}} {{ nom() }}. {{ t('footer.droits') }}</span>
      <span style="display:flex; gap:16px; align-items:center;">
        <app-language-switcher variant="dark" />
        <a href="#" (click)="noop($event)" style="color:rgba(255,255,255,0.6); text-decoration:none;">{{ t('footer.mentionsLegales') }}</a>
        <a href="#" (click)="goConnexion($event)" style="color:rgba(255,255,255,0.75); font-weight:600; text-decoration:none;">{{ t('footer.espaceParent') }}</a>
        <a href="#" (click)="goFiche($event)" style="color:rgba(255,255,255,0.35); font-size:11.5px; text-decoration:none;">{{ t('footer.accesSecretariat') }}</a>
      </span>
    </div>
  </div>
</footer>

</div>
</ng-container>
    `
})
export class Vitrine extends CobimagBase {
    private etablissementService = inject(EtablissementService);
    private vitrineService       = inject(VitrineService);

    nom            = this.etablissementService.nom;
    logoUrl        = this.etablissementService.logoUrl;
    displayLogoUrl = computed(() => this.logoUrl() ?? '/assets/logo-cobimag.png');

    readonly currentYear    = new Date().getFullYear();
    readonly mobileMenuOpen = signal(false);

    // Scroll → repli de la barre de contact
    private readonly scrollY     = signal(0);
    private readonly onScroll    = () => this.scrollY.set(window.scrollY);
    private readonly topbarVisible = computed(() => this.scrollY() < 80);
    readonly topbarStyle = computed(() => {
        const v = this.topbarVisible();
        return [
            'background:#008B47; color:#FFFFFF; font-size:12.5px;',
            'display:flex; flex-wrap:wrap; gap:14px; align-items:center; justify-content:space-between;',
            'overflow:hidden; transition:max-height 0.28s ease, padding 0.28s ease;',
            v ? 'max-height:60px; padding:7px 24px;' : 'max-height:0; padding:0 24px;',
        ].join(' ');
    });

    constructor() {
        super();
        if (typeof window !== 'undefined')
            window.addEventListener('scroll', this.onScroll, { passive: true });
    }

    override ngOnDestroy(): void {
        if (typeof window !== 'undefined')
            window.removeEventListener('scroll', this.onScroll);
        super.ngOnDestroy();
    }

    // Données statiques
    readonly stats        = STATS;
    readonly presentation = PRESENTATION;
    readonly cycles       = CYCLES;
    readonly systems      : SystemData[] = [SYSTEM_FR, SYSTEM_EN];
    readonly steps        = STEPS;
    readonly news         = NEWS;

    // Accès indexé au tableau vie scolaire (pour le template @for)
    readonly vieScolaireHorairesItems  = VIE_SCOLAIRE[0].items;
    readonly vieScolaireActivitesItems = VIE_SCOLAIRE[1].items;
    readonly vieScolaireCantineItems   = VIE_SCOLAIRE[2].items;

    // Données API (conservées depuis PROMPT_F03)
    contenuMotFondateur = toSignal<ContenuVitrineResponse | null>(
        this.vitrineService.getContenu('MOT_FONDATEUR').pipe(catchError(() => of(null))),
        { initialValue: null }
    );
    contenuHoraires = toSignal<ContenuVitrineResponse | null>(
        this.vitrineService.getContenu('HORAIRES_COURS').pipe(catchError(() => of(null))),
        { initialValue: null }
    );
    contenuActivites = toSignal<ContenuVitrineResponse | null>(
        this.vitrineService.getContenu('ACTIVITES_PERISCOLAIRES').pipe(catchError(() => of(null))),
        { initialValue: null }
    );
    contenuAdmissions = toSignal<ContenuVitrineResponse | null>(
        this.vitrineService.getContenu('COMMENT_INSCRIRE').pipe(catchError(() => of(null))),
        { initialValue: null }
    );
    equipe = toSignal(
        this.vitrineService.getEquipePedagogique().pipe(catchError(() => of([] as MembreEquipePedagogiqueResponse[]))),
        { initialValue: [] as MembreEquipePedagogiqueResponse[] }
    );
    actualites = toSignal<PageResponse<ActualiteResponse> | null>(
        this.vitrineService.getActualites(0, 6).pipe(catchError(() => of(null))),
        { initialValue: null }
    );

    initials(): string {
        const parts = this.nom().split(/\s+/).filter(p => p.length > 0);
        return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
    }

    toggleMobileMenu(): void { this.mobileMenuOpen.update(v => !v); }
    closeMobileMenu(): void  { this.mobileMenuOpen.set(false); }

    formatDate(dateStr: string): string {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    excerpt(contenu: string, max = 150): string {
        return contenu.length > max ? contenu.substring(0, max).trimEnd() + '…' : contenu;
    }
}
