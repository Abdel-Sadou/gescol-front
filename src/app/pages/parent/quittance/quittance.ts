import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { TranslocoDirective } from '@jsverse/transloco';
import { CobimagBase } from '@/app/shared/cobimag-base';
import { ParentDashboardService, VersementResponse, SuiviEleveResponse } from '@/app/core/services/parent-dashboard.service';
import { buildQrCells, formatXAF } from '@/app/data/parent.data';

type QuittanceState =
    | { kind: 'found'; versement: VersementResponse; tauxScolarite: number | null; classeLibelle: string }
    | { kind: 'notFound' }
    | { kind: 'error' }
    | { kind: 'noEleveId' };

// Zéro import PrimeNG — ADR-011 (zone Espace Parent).
// Aperçu visuel avec données réelles — le document officiel est GET /api/finances/quittances/{versementId}/pdf.
// TODO(API): remplacer getHistoriqueVersements + filtre client par un GET /api/finances/versements/{id} dédié
// si ce dernier est ajouté au backend, pour éviter le chargement de toute la liste.
@Component({
    selector: 'app-quittance',
    standalone: true,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [TranslocoDirective],
    template: `
<ng-container *transloco="let t; scope: 'parent'; prefix: 'parent'">

  <div class="no-print" style="position:fixed; top:12px; left:12px; right:12px; z-index:100; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
    <a href="#" (click)="goParent($event)" style="font-family:'Work Sans',sans-serif; font-size:12px; color:#5F6161; background:#FFFFFF; border:1px solid #E7E7E5; border-radius:20px; padding:6px 14px; text-decoration:none;">{{ t('quittance.retour') }}</a>
    @if (state() === undefined) {
      <span style="font-family:'Work Sans',sans-serif; font-size:12px; color:#5F6161; background:#F7F8F6; border:1px solid #E7E7E5; border-radius:20px; padding:6px 14px; opacity:0.5;">{{ t('quittance.bouton.telecharger') }}</span>
    } @else if (state()?.kind === 'found') {
      <button (click)="downloadPdf()" [disabled]="pdfLoading()"
        style="font-family:'Work Sans',sans-serif; font-size:12px; color:#008B47; background:#EAF5EE; border:1px solid #BFE3CD; border-radius:20px; padding:6px 14px; cursor:pointer;">
        @if (pdfLoading()) { {{ t('quittance.bouton.enCours') }} } @else { {{ t('quittance.bouton.telecharger') }} }
      </button>
    } @else {
      <button disabled style="font-family:'Work Sans',sans-serif; font-size:12px; color:#5F6161; background:#F7F8F6; border:1px solid #E7E7E5; border-radius:20px; padding:6px 14px; opacity:0.5; cursor:default;">{{ t('quittance.bouton.telecharger') }}</button>
    }
  </div>

  <!-- États hors found -->
  @if (state() === undefined) {
    <div style="display:flex; align-items:center; justify-content:center; min-height:60vh;">
      <div style="width:32px; height:32px; border-radius:50%; border:3px solid #E7E7E5; border-top-color:#008B47;"></div>
    </div>
  } @else if (state()?.kind === 'noEleveId' || state()?.kind === 'notFound') {
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; text-align:center; padding:24px; font-family:'Work Sans',sans-serif;">
      <p style="font-size:15px; color:#5F6161; margin:0;">{{ t('quittance.introuvable') }}</p>
      <a href="#" (click)="goParent($event)" style="color:#008B47; font-weight:700; text-decoration:none;">{{ t('quittance.retour') }}</a>
    </div>
  } @else if (state()?.kind === 'error') {
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; text-align:center; padding:24px; font-family:'Work Sans',sans-serif;">
      <p style="font-size:15px; color:#5F6161; margin:0;">{{ t('quittance.erreur') }}</p>
      <a href="#" (click)="goParent($event)" style="color:#008B47; font-weight:700; text-decoration:none;">{{ t('quittance.retour') }}</a>
    </div>
  } @else {

  <p class="no-print" style="font-family:'Work Sans',sans-serif; font-size:11px; color:#5F6161; background:#FDECE1; border:1px solid #F0C39E; border-radius:4px; padding:8px 14px; max-width:500px; margin:56px auto 0; text-align:center;">{{ t('quittance.avis') }}</p>

  <doc-page width="148mm" height="210mm">
  <section class="page" style="padding:20px 24px; font-family:'Work Sans',sans-serif; color:#1c2a20; background:#FFFFFF; display:flex; flex-direction:column; gap:8px;">

    <!-- ─── Bloc 1 : souche établissement ─── -->
    <div style="position:relative; border:1px solid #1c2a20; border-radius:2px; padding:10px 12px; display:flex; flex-direction:column; gap:5px;">
      <img src="assets/logo-cobimag.png" alt="" style="position:absolute; top:50%; left:50%; width:130px; height:130px; transform:translate(-50%,-50%) rotate(-10deg); opacity:0.06; pointer-events:none; border-radius:50%; object-fit:cover;">

      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; position:relative;">
        <div style="display:flex; gap:6px; align-items:flex-start;">
          <img src="assets/logo-cobimag.png" width="26" height="26" alt="Logo COBIMAG" style="flex-shrink:0; border-radius:50%; object-fit:cover;">
          <div>
            <div style="font-family:'Lora',serif; font-weight:700; font-size:8px; letter-spacing:0.2px; line-height:1.15;">COLLÈGE BILINGUE MARIE GISÈLE</div>
            <div style="font-size:6px; font-style:italic; color:#5F6161; line-height:1.2;">Marie Gisèle Bilingual College — COBIMAG</div>
            <div style="font-size:5.5px; color:#5F6161; line-height:1.3;">Nkolbisson, Yaoundé, Cameroun · +237 6 99 12 34 56 · contact@cobimag.cm</div>
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div style="width:100px; height:16px; background:repeating-linear-gradient(90deg,#1c2a20 0px,#1c2a20 1.5px,transparent 1.5px,transparent 2.7px,#1c2a20 2.7px,#1c2a20 4.8px,transparent 4.8px,transparent 6.3px,#1c2a20 6.3px,#1c2a20 7.2px,transparent 7.2px,transparent 10.2px);"></div>
          <div style="font-size:5px; font-family:monospace; color:#5F6161;">{{ t('quittance.document.codeBarre') }}</div>
        </div>
      </div>

      <div style="border-top:1.5px solid #008B47; border-bottom:1.5px solid #008B47; padding:3px 0; text-align:center;">
        <div style="font-family:'Lora',serif; font-weight:700; font-size:10.5px; letter-spacing:0.3px;">{{ t('quittance.document.titre') }}</div>
      </div>

      <div style="display:flex; justify-content:space-between; font-size:6.8px;">
        <span>{{ t('quittance.document.numero') }} <strong style="font-family:monospace;">{{ numeroQuittance() }}</strong></span>
        <span>{{ t('quittance.document.emise') }} <strong>{{ dateEmission() }}</strong></span>
      </div>

      <div style="border:1px solid #C9CBC9;">
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr;">
          <div style="padding:3px 6px; border-right:1px solid #E3E4E2; border-bottom:1px solid #E3E4E2;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.nom') }}</div><div style="font-size:7px; font-weight:600;">{{ eleveNom() }}</div></div>
          <div style="padding:3px 6px; border-right:1px solid #E3E4E2; border-bottom:1px solid #E3E4E2;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.prenom') }}</div><div style="font-size:7px; font-weight:600;">{{ elevePrenom() }}</div></div>
          <div style="padding:3px 6px; border-bottom:1px solid #E3E4E2;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.annee') }}</div><div style="font-size:7px; font-weight:600;">{{ anneeScolaire() }}</div></div>
          <div style="padding:3px 6px; border-right:1px solid #E3E4E2;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.classe') }}</div><div style="font-size:7px; font-weight:600;">{{ classeDisplay() }}</div></div>
          <div style="padding:3px 6px; border-right:1px solid #E3E4E2;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.sousSysteme') }}</div><div style="font-size:7px; font-weight:600;">{{ sousSysteme() }}</div></div>
          <div style="padding:3px 6px;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.matricule') }}</div><div style="font-size:7px; font-weight:600;">{{ eleveMatricule() }}</div></div>
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:6.8px;">
        <thead>
          <tr style="background:#EAF5EE;">
            <th style="text-align:left; padding:3px 6px; border:1px solid #C9CBC9; font-weight:700;">{{ t('quittance.document.table.designation') }}</th>
            <th style="text-align:right; padding:3px 6px; border:1px solid #C9CBC9; font-weight:700; width:66px;">{{ t('quittance.document.table.montant') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:2.5px 6px; border:1px solid #C9CBC9;">{{ t('quittance.document.table.total') }}</td><td style="padding:2.5px 6px; border:1px solid #C9CBC9; text-align:right;">{{ totalDuFmt() }}</td></tr>
          <tr><td style="padding:2.5px 6px; border:1px solid #C9CBC9;">{{ t('quittance.document.table.dejaVerse') }}</td><td style="padding:2.5px 6px; border:1px solid #C9CBC9; text-align:right;">{{ dejaVerseFmt() }}</td></tr>
          <tr style="background:#FDECE1;"><td style="padding:2.5px 6px; border:1px solid #C9CBC9; font-weight:700;">{{ t('quittance.document.table.verseAujourdhui') }}</td><td style="padding:2.5px 6px; border:1px solid #C9CBC9; text-align:right; font-weight:700; color:#8a4416;">{{ verseFmt() }}</td></tr>
          <tr><td style="padding:2.5px 6px; border:1px solid #C9CBC9; font-weight:700;">{{ t('quittance.document.table.resteAVerser') }}</td><td style="padding:2.5px 6px; border:1px solid #C9CBC9; text-align:right; font-weight:700;">{{ resteFmt() }}</td></tr>
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:8px;">
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <svg viewBox="0 0 21 21" width="46" height="46" style="border:1px solid #1c2a20; background:#FFFFFF;">
            @for (cell of qrCells; track $index) {
              <rect [attr.x]="cell.x" [attr.y]="cell.y" width="1" height="1" fill="#1c2a20"></rect>
            }
          </svg>
          <div style="font-size:4.6px; font-family:monospace; color:#5F6161; text-align:center; max-width:56px; line-height:1.2;">{{ t('quittance.document.qr') }}</div>
        </div>
        <div style="text-align:center; min-width:130px;">
          <div style="border-bottom:1px solid #1c2a20; height:20px;"></div>
          <div style="font-size:6.2px; font-weight:600; margin-top:2px;">{{ t('quittance.document.responsable') }}</div>
          <div style="font-size:5.2px; color:#5F6161;">{{ t('quittance.document.signatureCachet') }}</div>
        </div>
      </div>
    </div>

    <div style="text-align:center; font-size:6px; font-weight:700; letter-spacing:0.5px; color:#5F6161;">{{ t('quittance.document.souche') }}</div>

    <div style="border-top:1px dashed #5F6161; display:flex; align-items:center; justify-content:center; position:relative;">
      <span style="background:#FFFFFF; padding:0 6px; font-size:5.5px; color:#5F6161; transform:translateY(-50%); font-family:monospace;">{{ t('quittance.document.decouperIci') }}</span>
    </div>

    <!-- ─── Bloc 2 : copie parent ─── -->
    <div style="position:relative; border:1px solid #1c2a20; border-radius:2px; padding:10px 12px; display:flex; flex-direction:column; gap:5px;">
      <img src="assets/logo-cobimag.png" alt="" style="position:absolute; top:50%; left:50%; width:130px; height:130px; transform:translate(-50%,-50%) rotate(-10deg); opacity:0.06; pointer-events:none; border-radius:50%; object-fit:cover;">

      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; position:relative;">
        <div style="display:flex; gap:6px; align-items:flex-start;">
          <img src="assets/logo-cobimag.png" width="26" height="26" alt="Logo COBIMAG" style="flex-shrink:0; border-radius:50%; object-fit:cover;">
          <div>
            <div style="font-family:'Lora',serif; font-weight:700; font-size:8px; letter-spacing:0.2px; line-height:1.15;">COLLÈGE BILINGUE MARIE GISÈLE</div>
            <div style="font-size:6px; font-style:italic; color:#5F6161; line-height:1.2;">Marie Gisèle Bilingual College — COBIMAG</div>
            <div style="font-size:5.5px; color:#5F6161; line-height:1.3;">Nkolbisson, Yaoundé, Cameroun · +237 6 99 12 34 56 · contact@cobimag.cm</div>
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div style="width:100px; height:16px; background:repeating-linear-gradient(90deg,#1c2a20 0px,#1c2a20 1.5px,transparent 1.5px,transparent 2.7px,#1c2a20 2.7px,#1c2a20 4.8px,transparent 4.8px,transparent 6.3px,#1c2a20 6.3px,#1c2a20 7.2px,transparent 7.2px,transparent 10.2px);"></div>
          <div style="font-size:5px; font-family:monospace; color:#5F6161;">{{ t('quittance.document.codeBarre') }}</div>
        </div>
      </div>

      <div style="border-top:1.5px solid #008B47; border-bottom:1.5px solid #008B47; padding:3px 0; text-align:center;">
        <div style="font-family:'Lora',serif; font-weight:700; font-size:10.5px; letter-spacing:0.3px;">{{ t('quittance.document.titre') }}</div>
      </div>

      <div style="display:flex; justify-content:space-between; font-size:6.8px;">
        <span>{{ t('quittance.document.numero') }} <strong style="font-family:monospace;">{{ numeroQuittance() }}</strong></span>
        <span>{{ t('quittance.document.emise') }} <strong>{{ dateEmission() }}</strong></span>
      </div>

      <div style="border:1px solid #C9CBC9;">
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr;">
          <div style="padding:3px 6px; border-right:1px solid #E3E4E2; border-bottom:1px solid #E3E4E2;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.nom') }}</div><div style="font-size:7px; font-weight:600;">{{ eleveNom() }}</div></div>
          <div style="padding:3px 6px; border-right:1px solid #E3E4E2; border-bottom:1px solid #E3E4E2;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.prenom') }}</div><div style="font-size:7px; font-weight:600;">{{ elevePrenom() }}</div></div>
          <div style="padding:3px 6px; border-bottom:1px solid #E3E4E2;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.annee') }}</div><div style="font-size:7px; font-weight:600;">{{ anneeScolaire() }}</div></div>
          <div style="padding:3px 6px; border-right:1px solid #E3E4E2;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.classe') }}</div><div style="font-size:7px; font-weight:600;">{{ classeDisplay() }}</div></div>
          <div style="padding:3px 6px; border-right:1px solid #E3E4E2;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.sousSysteme') }}</div><div style="font-size:7px; font-weight:600;">{{ sousSysteme() }}</div></div>
          <div style="padding:3px 6px;"><div style="font-size:5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('quittance.document.champ.matricule') }}</div><div style="font-size:7px; font-weight:600;">{{ eleveMatricule() }}</div></div>
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:6.8px;">
        <thead>
          <tr style="background:#EAF5EE;">
            <th style="text-align:left; padding:3px 6px; border:1px solid #C9CBC9; font-weight:700;">{{ t('quittance.document.table.designation') }}</th>
            <th style="text-align:right; padding:3px 6px; border:1px solid #C9CBC9; font-weight:700; width:66px;">{{ t('quittance.document.table.montant') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:2.5px 6px; border:1px solid #C9CBC9;">{{ t('quittance.document.table.total') }}</td><td style="padding:2.5px 6px; border:1px solid #C9CBC9; text-align:right;">{{ totalDuFmt() }}</td></tr>
          <tr><td style="padding:2.5px 6px; border:1px solid #C9CBC9;">{{ t('quittance.document.table.dejaVerse') }}</td><td style="padding:2.5px 6px; border:1px solid #C9CBC9; text-align:right;">{{ dejaVerseFmt() }}</td></tr>
          <tr style="background:#FDECE1;"><td style="padding:2.5px 6px; border:1px solid #C9CBC9; font-weight:700;">{{ t('quittance.document.table.verseAujourdhui') }}</td><td style="padding:2.5px 6px; border:1px solid #C9CBC9; text-align:right; font-weight:700; color:#8a4416;">{{ verseFmt() }}</td></tr>
          <tr><td style="padding:2.5px 6px; border:1px solid #C9CBC9; font-weight:700;">{{ t('quittance.document.table.resteAVerser') }}</td><td style="padding:2.5px 6px; border:1px solid #C9CBC9; text-align:right; font-weight:700;">{{ resteFmt() }}</td></tr>
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:8px;">
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <svg viewBox="0 0 21 21" width="46" height="46" style="border:1px solid #1c2a20; background:#FFFFFF;">
            @for (cell of qrCells; track $index) {
              <rect [attr.x]="cell.x" [attr.y]="cell.y" width="1" height="1" fill="#1c2a20"></rect>
            }
          </svg>
          <div style="font-size:4.6px; font-family:monospace; color:#5F6161; text-align:center; max-width:56px; line-height:1.2;">{{ t('quittance.document.qr') }}</div>
        </div>
        <div style="text-align:center; min-width:130px;">
          <div style="border-bottom:1px solid #1c2a20; height:20px;"></div>
          <div style="font-size:6.2px; font-weight:600; margin-top:2px;">{{ t('quittance.document.responsable') }}</div>
          <div style="font-size:5.2px; color:#5F6161;">{{ t('quittance.document.signatureCachet') }}</div>
        </div>
      </div>
    </div>

    <div style="text-align:center; font-size:6px; font-weight:700; letter-spacing:0.5px; color:#5F6161;">{{ t('quittance.document.copieParent') }}</div>
  </section>
  </doc-page>

  } <!-- fin @else found -->

</ng-container>
    `
})
export class Quittance extends CobimagBase {
    private route         = inject(ActivatedRoute);
    private parentService = inject(ParentDashboardService);

    readonly qrCells = buildQrCells();

    // undefined = loading ; QuittanceState = résultat
    readonly state = toSignal<QuittanceState>(
        this.route.paramMap.pipe(
            map(p => p.get('versementId') ?? ''),
            switchMap(versementId => {
                if (!versementId) return of<QuittanceState>({ kind: 'notFound' });
                return this.route.queryParamMap.pipe(
                    map(q => q.get('eleveId') ?? ''),
                    switchMap(eleveId => {
                        if (!eleveId) return of<QuittanceState>({ kind: 'noEleveId' });
                        const classeLibelle = this.route.snapshot.queryParamMap.get('cl') ?? '';
                        return forkJoin([
                            // TODO(API): remplacer par GET /api/finances/versements/{id} si disponible
                            this.parentService.getHistoriqueVersements(eleveId).pipe(
                                map(page => page.content.find(v => v.id === versementId) ?? null)
                            ),
                            this.parentService.getSuivi(eleveId).pipe(
                                catchError(() => of(null as SuiviEleveResponse | null))
                            )
                        ]).pipe(
                            map(([versement, suivi]): QuittanceState => {
                                if (!versement) return { kind: 'notFound' };
                                return {
                                    kind: 'found',
                                    versement,
                                    tauxScolarite: suivi?.solde?.tauxScolarite ?? null,
                                    classeLibelle,
                                };
                            }),
                            catchError(() => of<QuittanceState>({ kind: 'error' }))
                        );
                    })
                );
            })
        )
    );

    private foundData = computed(() => {
        const s = this.state();
        return s?.kind === 'found' ? s : null;
    });

    readonly versementId     = computed(() => this.foundData()?.versement.id ?? '');
    readonly numeroQuittance = computed(() => this.foundData()?.versement.numeroQuittance ?? '—');
    readonly dateEmission    = computed(() => {
        const d = this.foundData()?.versement.dateVersement;
        return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
    });
    readonly eleveNom        = computed(() => this.foundData()?.versement.eleveNom ?? '—');
    readonly elevePrenom     = computed(() => this.foundData()?.versement.elevePrenom ?? '—');
    readonly eleveMatricule  = computed(() => this.foundData()?.versement.eleveMatricule ?? '—');
    readonly anneeScolaire   = computed(() => this.foundData()?.versement.anneeScolaire ?? '—');
    readonly classeDisplay   = computed(() => this.foundData()?.classeLibelle || '—');

    readonly sousSysteme = computed(() => {
        const cl = (this.foundData()?.classeLibelle ?? '').toLowerCase();
        return cl.startsWith('form') || cl.includes('sixth') || cl.includes('upper') || cl.includes('lower')
            ? 'Anglophone' : 'Francophone';
    });

    readonly totalDuFmt = computed(() => {
        const t = this.foundData()?.tauxScolarite;
        return t != null ? formatXAF(t) : '—';
    });
    readonly verseFmt = computed(() => {
        const v = this.foundData()?.versement;
        return v ? formatXAF(v.montant) : '—';
    });
    readonly resteFmt = computed(() => {
        const v = this.foundData()?.versement;
        return v ? formatXAF(v.soldeApresVersement) : '—';
    });
    readonly dejaVerseFmt = computed(() => {
        const d = this.foundData();
        if (!d || d.tauxScolarite == null) return '—';
        const before = d.tauxScolarite - d.versement.soldeApresVersement - d.versement.montant;
        return formatXAF(Math.max(0, before));
    });

    readonly pdfLoading = signal(false);

    downloadPdf(): void {
        const id = this.versementId();
        if (!id || this.pdfLoading()) return;
        this.pdfLoading.set(true);
        this.parentService.downloadQuittancePdf(id).pipe(
            take(1),
            catchError(() => of(null))
        ).subscribe(blob => {
            this.pdfLoading.set(false);
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quittance-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}
