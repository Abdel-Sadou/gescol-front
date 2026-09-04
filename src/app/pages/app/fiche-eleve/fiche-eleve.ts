import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@/app/core/services/auth.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, map, switchMap, catchError, distinctUntilChanged, startWith } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { formatXAF } from '@/app/data/parent.data';

// Zone App interne — PrimeNG autorisé mais on conserve le CSS propre ici pour ce composant.
// STUDENTS statiques retirés — recherche réelle via GET /api/eleves.

interface PageResponse<T> { content: T[]; }

interface EleveResponse {
    id: string; matricule: string; nom: string; prenom: string;
    sexe: 'M' | 'F'; dateNaissance: string; lieuNaissance: string | null;
    classeId: string; classeLibelle: string; redoublant: boolean;
    sousSysteme: 'FRANCOPHONE' | 'ANGLOPHONE' | null;
    apteSport: boolean; groupeSanguin: string | null;
    nomPere: string | null; nomMere: string | null; quartier: string | null;
    personneContact: string | null; telephoneContact: string | null;
    etablissementId: string; dateCreation: string; dateModification: string | null;
}

interface SoldeResponse {
    eleveId: string; anneeScolaire: string;
    tauxScolarite: number; totalVerse: number; soldeRestant: number;
}

type SearchState =
    | { kind: 'idle' }
    | { kind: 'searching' }
    | { kind: 'found'; data: EleveResponse[] }
    | { kind: 'error' };

type DetailState =
    | { kind: 'none' }
    | { kind: 'loading' }
    | { kind: 'found'; eleve: EleveResponse; solde: SoldeResponse | null }
    | { kind: 'error' };

@Component({
    selector: 'app-fiche-eleve',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoDirective],
    template: `
<ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
<div class="card" style="line-height:1.5;">

  <h2 class="text-xl font-semibold mb-4">{{ t('fiche.titre') }}</h2>

  <main style="max-width:900px;">
    <div [style]="'position:relative; margin-bottom:' + (showSuggestions() ? '4px' : '24px') + ';'">
      <input type="text" [value]="query()" (input)="onQueryChange($event)" (focus)="onFocus()" (blur)="onBlur()"
        [placeholder]="t('fiche.recherche.placeholder')"
        style="width:100%; font-size:15px; padding:14px 16px; border:1.5px solid var(--color-border-field); border-radius:var(--radius-sm); color:var(--color-text-body); background:var(--color-field-bg); box-sizing:border-box; outline:none;">

      @if (showSuggestions()) {
        <div style="position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-sm); box-shadow:0 4px 14px rgba(0,0,0,0.1); z-index:10; overflow:hidden;">
          @if (isSearching()) {
            <div style="padding:12px 14px; font-size:13px; color:#5F6161; display:flex; align-items:center; gap:8px;">
              <div style="width:14px; height:14px; border-radius:50%; border:2px solid #E7E7E5; border-top-color:#008B47; flex-shrink:0;"></div>
              {{ t('fiche.recherche.chargement') }}
            </div>
          } @else if (suggestions().length > 0) {
            @for (s of suggestions(); track s.id) {
              <button (click)="selectStudent(s.id)" style="width:100%; text-align:left; background:none; border:none; border-bottom:1px solid #F0F0EE; padding:10px 14px; display:flex; align-items:center; gap:12px; cursor:pointer;">
                <span style="width:34px; height:34px; border-radius:50%; flex-shrink:0; background:repeating-linear-gradient(45deg, rgba(0,139,71,0.12) 0px, rgba(0,139,71,0.12) 6px, transparent 6px, transparent 12px), #EDEEEC; display:flex; align-items:center; justify-content:center;"><span style="font-family:monospace; font-size:7px; color:#5F6161;">PHOTO</span></span>
                <span style="display:flex; flex-direction:column;">
                  <span style="font-weight:600; color:#1c2a20; font-size:13.5px;">{{ s.nom }} {{ s.prenom }}</span>
                  <span style="font-size:11.5px; color:#5F6161;">{{ s.matricule }} · {{ s.classeLibelle }}</span>
                </span>
              </button>
            }
          } @else if (noResults()) {
            <div style="padding:14px; font-size:13px; color:#5F6161;">{{ t('fiche.recherche.aucunResultat') }}</div>
          } @else if (searchError()) {
            <div style="padding:12px 14px; font-size:13px; color:#8a4416;">{{ t('fiche.recherche.erreur') }}</div>
          }
        </div>
      }
    </div>

    <!-- ══ ÉTATS FICHE ════════════════════════════════════════════════════ -->
    @if (detail().kind === 'loading') {
      <div style="display:flex; align-items:center; gap:10px; padding:40px 0; color:#5F6161; font-size:13.5px;">
        <div style="width:22px; height:22px; border-radius:50%; border:2px solid #E7E7E5; border-top-color:#008B47; flex-shrink:0;"></div>
        {{ t('fiche.chargement') }}
      </div>

    } @else if (detail().kind === 'error') {
      <div style="background:#FDECE1; border:1px solid #F0C39E; border-radius:4px; padding:16px 20px; font-size:13.5px; color:#8a4416;">
        {{ t('fiche.erreur') }}
      </div>

    } @else if (decoratedEleve(); as eleve) {
      <div style="display:flex; flex-direction:column; gap:16px;">

        <div style="background:#FFFFFF; border-top:3px solid #008B47; border-radius:2px; padding:20px 22px; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; gap:18px; align-items:center; flex-wrap:wrap;">
          <div style="width:78px; height:78px; border-radius:4px; flex-shrink:0; background:repeating-linear-gradient(45deg, rgba(0,139,71,0.12) 0px, rgba(0,139,71,0.12) 8px, transparent 8px, transparent 16px), #EDEEEC; display:flex; align-items:center; justify-content:center;"><span style="font-family:monospace; font-size:9px; color:#5F6161;">PHOTO</span></div>
          <div style="flex:1; min-width:220px;">
            <div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">
              <h1 style="font-family:'Lora',serif; font-size:22px; color:#1c2a20; margin:0; font-weight:700;">{{ eleve.nom }} {{ eleve.prenom }}</h1>
              <span style="font-family:monospace; font-weight:700; font-size:13px; color:#008B47; background:#EAF5EE; padding:3px 10px; border-radius:3px;">{{ eleve.matricule }}</span>
            </div>
            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
              <span style="font-size:12px; font-weight:600; color:#1c2a20; background:#F0F1EF; padding:4px 10px; border-radius:20px;">{{ eleve.classe }}</span>
              <span [style]="'display:inline-flex; align-items:center; gap:5px; border-radius:20px; padding:4px 10px; font-size:12px; font-weight:700; background:'+eleve.trackBg+'; color:'+eleve.trackColor+'; border:'+eleve.trackBorder+';'">{{ eleve.trackLabel }}</span>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
          <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-radius:2px; padding:20px 22px;">
            <h3 style="font-family:'Lora',serif; font-size:14px; color:#1c2a20; margin:0 0 12px; font-weight:700;">{{ t('fiche.info.titre') }}</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px 14px; font-size:13px;">
              <div>
                <div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('fiche.info.sexe') }}</div>
                <div style="color:#1c2a20; font-weight:600;">{{ eleve.sexe }}</div>
              </div>
              <div>
                <div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('fiche.info.groupeSanguin') }}</div>
                <div style="color:#1c2a20; font-weight:600;">{{ eleve.groupeSanguin }}</div>
              </div>
              <div style="grid-column:1 / -1;">
                <div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('fiche.info.naissance') }}</div>
                <div style="color:#1c2a20; font-weight:600;">{{ eleve.naissance }}</div>
              </div>
              <div>
                <div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161; margin-bottom:3px;">{{ t('fiche.info.sport') }}</div>
                <span [style]="'font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px; background:'+eleve.sportBg+'; color:'+eleve.sportColor+';'">{{ eleve.sport ? t('fiche.info.oui') : t('fiche.info.non') }}</span>
              </div>
              <div>
                <div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161; margin-bottom:3px;">{{ t('fiche.info.redoublant') }}</div>
                <span [style]="'font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px; background:'+eleve.redoubleBg+'; color:'+eleve.redoubleColor+';'">{{ eleve.redouble ? t('fiche.info.oui') : t('fiche.info.non') }}</span>
              </div>
            </div>
          </div>

          <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-radius:2px; padding:20px 22px;">
            <h3 style="font-family:'Lora',serif; font-size:14px; color:#1c2a20; margin:0 0 12px; font-weight:700;">{{ t('fiche.filiation.titre') }}</h3>
            <div style="display:flex; flex-direction:column; gap:9px; font-size:13px;">
              <div><div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('fiche.filiation.pere') }}</div><div style="color:#1c2a20; font-weight:600;">{{ eleve.pere }}</div></div>
              <div><div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('fiche.filiation.mere') }}</div><div style="color:#1c2a20; font-weight:600;">{{ eleve.mere }}</div></div>
              <div><div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('fiche.filiation.quartier') }}</div><div style="color:#1c2a20; font-weight:600;">{{ eleve.quartier }}</div></div>
              <div><div style="font-size:10.5px; text-transform:uppercase; letter-spacing:0.3px; color:#5F6161;">{{ t('fiche.filiation.contact') }}</div><div style="color:#1c2a20; font-weight:600;">{{ eleve.contact }}</div></div>
            </div>
          </div>
        </div>

        @if (eleve.solde !== null) {
          <div [style]="'display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; background:'+eleve.soldeBg+'; border:1px solid '+eleve.soldeBorder+'; border-radius:2px; padding:16px 20px;'">
            <span style="font-size:13.5px; font-weight:600; color:#1c2a20;">{{ t('fiche.solde.label') }}</span>
            <span [style]="'font-family:Lora,serif; font-size:24px; font-weight:700; color:'+eleve.soldeColor+';'">{{ eleve.soldeFmt }}</span>
          </div>
        }

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          @if (canEdit()) {
            <a href="#" (click)="goEditer($event)" style="border:1.5px solid var(--color-primary); color:var(--color-primary); font-weight:700; font-size:13.5px; padding:11px 18px; border-radius:2px; text-decoration:none;">{{ t('fiche.bouton.modifier') }}</a>
          }
          <span title="Module finances à venir" style="border:1.5px solid #E7E7E5; color:#B7B8B7; font-weight:700; font-size:13.5px; padding:11px 18px; border-radius:2px; cursor:not-allowed; background:#F7F8F6;">{{ t('fiche.bouton.versement') }}</span>
          <span title="Impression à venir" style="border:1.5px solid #E7E7E5; color:#B7B8B7; font-weight:700; font-size:13.5px; padding:11px 18px; border-radius:2px; cursor:not-allowed; background:#F7F8F6;">{{ t('fiche.bouton.imprimer') }}</span>
          <span [title]="t('fiche.bouton.suppressionInfo')" style="border:1.5px solid #E7E7E5; color:#B7B8B7; font-weight:700; font-size:13.5px; padding:11px 18px; border-radius:2px; cursor:not-allowed; background:#F7F8F6;">{{ t('fiche.bouton.supprimer') }}</span>
        </div>
      </div>

    } @else if (detail().kind === 'none') {
      <div style="text-align:center; padding:60px 20px; color:var(--color-text-muted); font-size:14px;">{{ t('fiche.aucuneSelection') }}</div>
    }
  </main>
</div>
</ng-container>
    `
})
export class FicheEleve {
    private http        = inject(HttpClient);
    private router      = inject(Router);
    private authService = inject(AuthService);

    // ── Recherche ─────────────────────────────────────────────────────────
    readonly query           = signal('');
    readonly showSuggestions = signal(false);

    // Pré-sélection depuis le query param ?id= (navigation depuis la liste)
    readonly selectedId = signal<string | null>(
        inject(ActivatedRoute).snapshot.queryParamMap.get('id')
    );

    private readonly searchRaw = toSignal<SearchState>(
        toObservable(this.query).pipe(
            debounceTime(300),
            map(q => q.trim()),
            distinctUntilChanged(),
            switchMap(q => {
                if (q.length < 2) return of({ kind: 'idle' as const });
                // Deux requêtes parallèles pour couvrir nom ET matricule (union côté client)
                const byNom = this.http.get<PageResponse<EleveResponse>>('/api/eleves', {
                    params: { nom: q, size: '5' }
                }).pipe(catchError(() => of({ content: [] as EleveResponse[] })));

                const byMat = this.http.get<PageResponse<EleveResponse>>('/api/eleves', {
                    params: { matricule: q, size: '5' }
                }).pipe(catchError(() => of({ content: [] as EleveResponse[] })));

                return forkJoin([byNom, byMat]).pipe(
                    map(([rNom, rMat]) => {
                        const seen = new Set<string>();
                        const merged: EleveResponse[] = [];
                        for (const e of [...rNom.content, ...rMat.content]) {
                            if (!seen.has(e.id)) { seen.add(e.id); merged.push(e); }
                        }
                        return { kind: 'found' as const, data: merged.slice(0, 5) };
                    }),
                    catchError(() => of({ kind: 'error' as const })),
                    startWith({ kind: 'searching' as const })
                );
            })
        )
    );

    readonly isSearching = computed(() => this.searchRaw()?.kind === 'searching');
    readonly suggestions = computed<EleveResponse[]>(() => {
        const s = this.searchRaw();
        return s?.kind === 'found' ? s.data : [];
    });
    readonly noResults   = computed(() => this.searchRaw()?.kind === 'found' && this.suggestions().length === 0);
    readonly searchError = computed(() => this.searchRaw()?.kind === 'error');

    // ── Détail élève sélectionné ──────────────────────────────────────────
    // Sans initialValue → Signal<DetailState | undefined>; undefined = rien sélectionné encore
    private readonly detailRaw = toSignal<DetailState>(
        toObservable(this.selectedId).pipe(
            switchMap(id => {
                if (!id) return of({ kind: 'none' as const });
                return forkJoin([
                    this.http.get<EleveResponse>(`/api/eleves/${id}`),
                    this.http.get<SoldeResponse>(`/api/finances/eleves/${id}/solde`).pipe(
                        catchError(() => of(null as SoldeResponse | null))
                    )
                ]).pipe(
                    map(([eleve, solde]) => ({ kind: 'found' as const, eleve, solde })),
                    catchError(() => of({ kind: 'error' as const })),
                    startWith({ kind: 'loading' as const })
                );
            })
        )
    );

    // Public computed pour le template — undefined (signal pas encore émis) traité comme 'none'
    readonly detail         = computed<DetailState>(() => this.detailRaw() ?? { kind: 'none' as const });
    readonly decoratedEleve = computed(() => {
        const s = this.detail();
        return s.kind === 'found' ? this.decorate(s.eleve, s.solde) : null;
    });

    readonly noop    = (e?: Event) => e?.preventDefault();
    readonly canEdit = computed(() => {
        const r = this.authService.role();
        return r === 'SUPER_ADMIN' || r === 'SECRETARIAT';
    });

    goEditer(e: Event): void {
        e.preventDefault();
        const id = this.selectedId();
        if (id) this.router.navigate(['/app/eleves', id, 'editer']);
    }

    onQueryChange(e: Event): void {
        const val = (e.target as HTMLInputElement).value;
        this.query.set(val);
        this.showSuggestions.set(val.trim().length >= 2);
    }

    onFocus(): void {
        if (this.query().trim().length >= 2) this.showSuggestions.set(true);
    }

    onBlur(): void {
        setTimeout(() => this.showSuggestions.set(false), 150);
    }

    selectStudent(id: string): void {
        this.selectedId.set(id);
        this.query.set('');
        this.showSuggestions.set(false);
    }

    private decorate(eleve: EleveResponse, solde: SoldeResponse | null) {
        const isFr = eleve.sousSysteme !== 'ANGLOPHONE';
        const soldeRestant = solde?.soldeRestant ?? null;
        return {
            nom: eleve.nom,
            prenom: eleve.prenom,
            matricule: eleve.matricule,
            classe: eleve.classeLibelle,
            trackLabel:  isFr ? 'Francophone' : 'Anglophone',
            trackBg:     isFr ? '#008B47' : '#FFFFFF',
            trackColor:  isFr ? '#FFFFFF' : '#008B47',
            trackBorder: isFr ? 'none'    : '1.5px solid #008B47',
            sexe:        eleve.sexe === 'M' ? 'Masculin' : 'Féminin',
            naissance:   this.fmtNaissance(eleve.dateNaissance, eleve.lieuNaissance),
            groupeSanguin: this.fmtGroupeSanguin(eleve.groupeSanguin),
            sport:       eleve.apteSport,
            sportBg:     eleve.apteSport  ? '#EAF5EE' : '#FDECE1',
            sportColor:  eleve.apteSport  ? '#008B47' : '#E8722C',
            redouble:    eleve.redoublant,
            redoubleBg:  eleve.redoublant ? '#FDECE1' : '#EAF5EE',
            redoubleColor: eleve.redoublant ? '#E8722C' : '#008B47',
            pere:        eleve.nomPere ?? '—',
            mere:        eleve.nomMere ?? '—',
            quartier:    eleve.quartier ?? '—',
            contact:     eleve.personneContact
                ? `${eleve.personneContact}${eleve.telephoneContact ? ' — ' + eleve.telephoneContact : ''}`
                : '—',
            solde:       soldeRestant,
            soldeFmt:    soldeRestant !== null ? formatXAF(soldeRestant) : '—',
            soldeColor:  soldeRestant !== null && soldeRestant > 0 ? '#C0392B' : '#008B47',
            soldeBg:     soldeRestant !== null && soldeRestant > 0 ? '#FDECE1' : '#EAF5EE',
            soldeBorder: soldeRestant !== null && soldeRestant > 0 ? '#F0C39E' : '#BFE3CD',
        };
    }

    private fmtNaissance(date: string, lieu: string | null): string {
        const d = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        return lieu ? `${d} à ${lieu}` : d;
    }

    private fmtGroupeSanguin(g: string | null): string {
        if (!g || g === 'INCONNU') return '—';
        return g.replace('_POS', '+').replace('_NEG', '-');
    }
}
