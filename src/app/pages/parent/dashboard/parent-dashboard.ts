import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { map, switchMap, catchError, filter, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
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
    imports: [TranslocoDirective],
    template: `
<ng-container *transloco="let t; scope: 'parent'; prefix: 'parent'">
<div style="font-family:'Work Sans',sans-serif; color:#5F6161; background:#F7F8F6; min-height:100vh; line-height:1.5; overflow-x:clip;">

  <header style="position:sticky; top:0; z-index:50; background:#FFFFFF; box-shadow:0 1px 0 rgba(0,0,0,0.08);">
    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 24px; gap:16px; flex-wrap:nowrap;">
      <a href="#" (click)="goLanding($event)" style="display:flex; align-items:center; gap:10px; color:#1c2a20; min-width:0; overflow:hidden; text-decoration:none;">
        <div [style]="'width:'+logoParentSize+'px;height:'+logoParentSize+'px;border-radius:50%;background:#008B47;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:700;font-size:14px;color:#FFFFFF;flex-shrink:0;'">EP</div>
        <span style="display:flex; flex-direction:column; line-height:1.2; min-width:0;">
          <span style="font-family:'Lora',serif; font-weight:700; font-size:15px; color:#1c2a20; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ t('dashboard.zone') }}</span>
          @if (showSubtitle) {
            <span style="font-size:10.5px; font-style:italic; color:#5F6161; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ t('dashboard.sousTitre') }}</span>
          }
        </span>
      </a>
      <div style="display:flex; align-items:center; gap:10px; overflow-x:auto; flex-shrink:0;">
        <span [title]="t('dashboard.bientotDisponible')" style="background:#E8722C; color:#FFFFFF; font-weight:700; font-size:13px; padding:9px 16px; border-radius:2px; white-space:nowrap; opacity:0.45; cursor:not-allowed;">{{ t('dashboard.nouvelleInscription') }}</span>
        <a href="#" (click)="onDeconnexion($event)" style="color:#5F6161; font-weight:600; font-size:13px; white-space:nowrap; padding:9px 4px; text-decoration:none;">{{ t('dashboard.deconnexion') }}</a>
      </div>
    </div>
  </header>

  <main style="max-width:1180px; margin:0 auto; padding:24px 20px 64px;">
    <p style="font-size:13.5px; color:#5F6161; margin:0 0 4px;">{{ t('dashboard.bonjour') }}</p>
    <h1 style="font-family:'Lora',serif; font-size:clamp(20px,3vw,26px); color:#1c2a20; margin:0 0 24px; font-weight:700;">{{parentDisplayName()}}</h1>

    <!-- ══ ÉTATS CHARGEMENT ENFANTS ═══════════════════════════════════════ -->
    @if (childrenLoading()) {
      <div style="display:flex; align-items:center; justify-content:center; min-height:40vh; flex-direction:column; gap:16px;">
        <div style="width:32px; height:32px; border-radius:50%; border:3px solid #E7E7E5; border-top-color:#008B47;"></div>
        <p style="font-size:13px; color:#5F6161; margin:0;">{{ t('dashboard.chargement') }}</p>
      </div>

    } @else if (childrenError()) {
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:40vh; gap:14px; text-align:center; padding:24px;">
        <p style="font-size:15px; font-weight:600; color:#1c2a20; margin:0;">{{ t('dashboard.erreur.titre') }}</p>
        <p style="font-size:13px; color:#5F6161; margin:0;">{{ t('dashboard.erreur.description') }}</p>
        <a href="#" (click)="reload($event)" style="color:#008B47; font-weight:700; text-decoration:none; font-size:13.5px;">{{ t('dashboard.erreur.reessayer') }}</a>
      </div>

    } @else if (enfants().length === 0) {
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:40vh; gap:14px; text-align:center; padding:24px; background:#FFFFFF; border:1px solid #E7E7E5; border-radius:4px; max-width:480px; margin:0 auto;">
        <p style="font-size:15px; font-weight:700; color:#1c2a20; margin:0; font-family:'Lora',serif;">{{ t('dashboard.aucunEnfant.titre') }}</p>
        <p style="font-size:13.5px; color:#5F6161; margin:0; line-height:1.6;">{{ t('dashboard.aucunEnfant.description') }}</p>
        <span [title]="t('dashboard.bientotDisponible')" style="background:#E8722C; color:#FFFFFF; font-weight:700; font-size:13.5px; padding:12px 22px; border-radius:2px; margin-top:6px; opacity:0.45; cursor:not-allowed;">{{ t('dashboard.aucunEnfant.cta') }}</span>
      </div>

    } @else {

      <!-- ══ SÉLECTEUR D'ENFANTS ══════════════════════════════════════════ -->
      @if (enfants().length > 1) {
        <p style="text-transform:uppercase; letter-spacing:1.3px; font-size:12px; font-weight:700; color:#E8722C; margin:0 0 12px;">{{ t('dashboard.mesEnfants') }}</p>
      }
      <div style="display:flex; gap:14px; overflow-x:auto; padding-bottom:6px; margin-bottom:28px;">
        @for (child of decoratedChildren(); track child.eleveId) {
          <button (click)="selectChild(child.eleveId)" [style]="'flex-shrink:0; width:180px; text-align:left; background:'+child.cardBg+'; border:'+child.cardBorder+'; border-radius:4px; padding:14px; cursor:pointer; display:flex; flex-direction:column; gap:8px;'">
            <div style="width:44px; height:44px; border-radius:50%; background:repeating-linear-gradient(45deg, rgba(0,139,71,0.12) 0px, rgba(0,139,71,0.12) 6px, transparent 6px, transparent 12px), #EDEEEC; display:flex; align-items:center; justify-content:center;">
              <span style="font-family:monospace; font-size:8px; color:#5F6161;">PHOTO</span>
            </div>
            <span style="font-weight:700; color:#1c2a20; font-size:14px;">{{child.nom}} {{child.prenom}}</span>
            <span style="font-size:12.5px; color:#5F6161;">{{child.classeLibelle}}</span>
            <span [style]="'display:inline-flex; align-self:flex-start; align-items:center; gap:5px; border-radius:20px; padding:3px 9px; font-size:10.5px; font-weight:700; background:'+child.trackBg+'; color:'+child.trackColor+'; border:'+child.trackBorder+';'">{{child.trackLabel}}</span>
          </button>
        }
      </div>

      @if (decoratedSelected(); as sel) {
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:18px;">
          <h2 style="font-family:'Lora',serif; font-size:20px; color:#1c2a20; margin:0; font-weight:700;">{{sel.nom}} {{sel.prenom}}</h2>
          <span style="font-size:13.5px; color:#5F6161;">{{sel.classeLibelle}}</span>
          <span [style]="'display:inline-flex; align-items:center; gap:5px; border-radius:20px; padding:4px 10px; font-size:11px; font-weight:700; background:'+sel.trackBg+'; color:'+sel.trackColor+'; border:'+sel.trackBorder+';'">{{sel.trackLabel}}</span>
        </div>
      }

      <!-- ══ ALERTE SOLDE ════════════════════════════════════════════════ -->
      @if (soldeRestant() > 0) {
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; background:#FDECE1; border:1px solid #F0C39E; border-radius:4px; padding:14px 18px; margin-bottom:22px;">
          <span style="font-size:13.5px; color:#8a4416; font-weight:600;">{{ t('dashboard.alerte.solde') }} {{soldeFmt()}}</span>
          <a href="#" (click)="goHistoriqueQuittance($event)" style="color:#E8722C; font-weight:700; font-size:13px; text-decoration:none;">{{ t('dashboard.alerte.voirQuittances') }}</a>
        </div>
      }

      <!-- ══ CARTES SUIVI ════════════════════════════════════════════════ -->
      @if (suiviLoading()) {
        <div style="display:flex; align-items:center; gap:10px; padding:20px 0; color:#5F6161; font-size:13px;">
          <div style="width:20px; height:20px; border-radius:50%; border:2px solid #E7E7E5; border-top-color:#008B47; flex-shrink:0;"></div>
          {{ t('dashboard.suivi.chargement') }}
        </div>
      } @else if (suiviError()) {
        <div style="background:#FDECE1; border:1px solid #F0C39E; border-radius:4px; padding:14px 18px; margin-bottom:22px; font-size:13px; color:#8a4416;">
          {{ t('dashboard.suivi.erreur') }}
        </div>
      } @else {
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:20px; margin-bottom:36px;">

          <!-- Scolarité -->
          <div style="background:#FFFFFF; border-top:3px solid #008B47; border-radius:2px; padding:22px; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:10px;">
            <h3 style="font-family:'Lora',serif; font-size:15.5px; color:#1c2a20; margin:0; font-weight:700;">{{ t('dashboard.scolarite.titre') }}</h3>
            <div style="display:flex; justify-content:space-between; font-size:13px;"><span>{{ t('dashboard.scolarite.totalDu') }}</span><span style="font-weight:600; color:#1c2a20;">{{totalFmt()}}</span></div>
            <div style="display:flex; justify-content:space-between; font-size:13px;"><span>{{ t('dashboard.scolarite.montantVerse') }}</span><span style="font-weight:600; color:#1c2a20;">{{verseFmt()}}</span></div>
            <div style="height:1px; background:#EEEEEC; margin:2px 0;"></div>
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <span style="font-size:13px; color:#5F6161;">{{ soldeRestant() > 0 ? t('dashboard.scolarite.soldeRestant') : t('dashboard.scolarite.aJour') }}</span>
              <span [style]="'font-family:Lora,serif; font-size:20px; font-weight:700; color:'+soldeColor()+';'">{{soldeFmt()}}</span>
            </div>
            <a href="#" (click)="goHistoriqueQuittance($event)" style="margin-top:6px; text-align:center; border:1.5px solid #008B47; color:#008B47; font-weight:700; font-size:13px; padding:10px; border-radius:2px; text-decoration:none;">{{ t('dashboard.scolarite.voirQuittances') }}</a>
          </div>

          <!-- Résultats -->
          <div style="background:#FFFFFF; border-top:3px solid #008B47; border-radius:2px; padding:22px; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:10px;">
            <h3 style="font-family:'Lora',serif; font-size:15.5px; color:#1c2a20; margin:0; font-weight:700;">{{ t('dashboard.resultats.titre') }}</h3>
            <span style="font-size:12.5px; color:#5F6161;">{{sequenceLibelle() || t('dashboard.resultats.sequence')}}</span>
            <span style="font-family:'Lora',serif; font-size:32px; font-weight:700; color:#1c2a20;">{{moyenneFmt()}}</span>
            @if (moyenneGenerale() !== null) {
              <span style="display:inline-flex; align-self:flex-start; background:#EAF5EE; color:#008B47; font-size:11.5px; font-weight:700; padding:4px 10px; border-radius:20px;">{{mention()}}</span>
            } @else {
              <span style="display:inline-flex; align-self:flex-start; background:#F0F1EF; color:#5F6161; font-size:11.5px; padding:4px 10px; border-radius:20px;">{{ t('dashboard.resultats.aucune') }}</span>
            }
            <a href="#" (click)="noop($event)" style="margin-top:auto; text-align:center; border:1.5px solid #008B47; color:#008B47; font-weight:700; font-size:13px; padding:10px; border-radius:2px; text-decoration:none; opacity:0.45; cursor:default;">{{ t('dashboard.resultats.voirBulletin') }}</a>
          </div>

          <!-- Discipline -->
          <div style="background:#FFFFFF; border-top:3px solid #008B47; border-radius:2px; padding:22px; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:10px;">
            <h3 style="font-family:'Lora',serif; font-size:15.5px; color:#1c2a20; margin:0; font-weight:700;">{{ t('dashboard.discipline.titre') }}</h3>
            <span style="font-family:'Lora',serif; font-size:32px; font-weight:700; color:#1c2a20;">{{nbIncidents()}}</span>
            <span style="font-size:12.5px; color:#5F6161;">{{ t('dashboard.discipline.incidents') }}</span>
            <span [style]="'display:inline-flex; align-self:flex-start; background:'+disciplineBg()+'; color:'+disciplineColor()+'; font-size:11.5px; font-weight:700; padding:4px 10px; border-radius:20px;'">
              {{ disciplineStatus() === 'ras' ? t('dashboard.discipline.ras') : t('dashboard.discipline.incidentsSignales') }}
            </span>
          </div>

        </div>
      }

      <!-- ══ HISTORIQUE DES VERSEMENTS ══════════════════════════════════ -->
      <p id="historique" style="text-transform:uppercase; letter-spacing:1.3px; font-size:12px; font-weight:700; color:#E8722C; margin:0 0 14px; scroll-margin-top:80px;">{{ t('dashboard.historique.titre') }}</p>

      @if (historiqueLoading()) {
        <div style="display:flex; align-items:center; gap:10px; padding:14px 0; color:#5F6161; font-size:13px;">
          <div style="width:18px; height:18px; border-radius:50%; border:2px solid #E7E7E5; border-top-color:#008B47; flex-shrink:0;"></div>
          {{ t('dashboard.suivi.chargement') }}
        </div>
      } @else if (historiqueError()) {
        <p style="font-size:13px; color:#C0392B; padding:14px 0; margin:0;">{{ t('dashboard.historique.erreur') }}</p>
      } @else if (versements().length === 0) {
        <p style="font-size:13px; color:#5F6161; padding:14px 0;">{{ t('dashboard.historique.aucun') }}</p>
      } @else {
        <div style="display:flex; flex-direction:column; gap:12px;">
          @for (h of versements(); track h.id) {
            <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-radius:4px; padding:16px 18px; display:flex; flex-direction:column; gap:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; flex-direction:column; gap:3px;">
                  <span style="font-weight:700; color:#1c2a20; font-size:14px;">{{formatDate(h.dateVersement)}}</span>
                  <span style="font-size:11px; color:#5F6161; font-family:monospace;">{{ t('dashboard.historique.quittance') }} {{h.numeroQuittance}}</span>
                </div>
                <span style="font-family:'Lora',serif; font-weight:700; color:#008B47; font-size:16px;">{{fmt(h.montant)}}</span>
              </div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:8px; font-size:12.5px; color:#5F6161;">
                <span>{{ t('dashboard.historique.mode') }} <strong style="color:#1c2a20;">{{formatMode(h.modePaiement)}}</strong></span>
                <span>{{ t('dashboard.historique.resteAPayer') }} <strong style="color:#1c2a20;">{{fmt(h.soldeApresVersement)}}</strong></span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
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
        return {
            ...c,
            trackLabel:  isFr ? tl('francophone') : tl('anglophone'),
            cardBg:      isSel ? '#EAF5EE' : '#FFFFFF',
            cardBorder:  isSel ? '1.5px solid #008B47' : '1px solid #E7E7E5',
            trackBg:     isFr  ? '#008B47' : '#FFFFFF',
            trackColor:  isFr  ? '#FFFFFF' : '#008B47',
            trackBorder: isFr  ? 'none'    : '1.5px solid #008B47',
        };
    }

    private inferTrack(classeLibelle: string): 'fr' | 'en' {
        const l = classeLibelle.toLowerCase();
        return l.startsWith('form') || l.includes('sixth') || l.includes('upper') || l.includes('lower') ? 'en' : 'fr';
    }
}
