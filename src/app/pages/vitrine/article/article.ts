import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoDirective } from '@jsverse/transloco';
import { CobimagBase } from '@/app/shared/cobimag-base';
import { VitrineService, ActualiteResponse } from '@/app/core/services/vitrine.service';
import { EtablissementService } from '@/app/core/services/etablissement.service';

type ArticleState =
    | { kind: 'found'; data: ActualiteResponse }
    | { kind: 'notFound' }
    | { kind: 'error' };

// Zone Vitrine — zéro PrimeNG (ADR-011).
// 404 = inexistant OU dépublié (indistinguable côté frontend, cf. API_CONTRACT.md §Actualités).
@Component({
    selector: 'app-article',
    standalone: true,
    imports: [TranslocoDirective],
    template: `
<ng-container *transloco="let t; scope: 'vitrine'; prefix: 'vitrine'">
<div style="font-family:'Work Sans',sans-serif; color:#5F6161; background:#FFFFFF; min-height:100vh; line-height:1.6;">

  <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
  <header style="position:sticky; top:0; z-index:50; background:#FFFFFF; border-bottom:1px solid #E7E7E5;">
    <div style="max-width:1180px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; padding:10px 24px; gap:16px; flex-wrap:nowrap;">
      <a href="#" (click)="goLanding($event)" style="display:flex; align-items:center; gap:10px; color:#1c2a20; min-width:0; overflow:hidden; text-decoration:none;">
        <img [src]="displayLogoUrl()" [attr.width]="logoParentSize" [attr.height]="logoParentSize" alt="Logo COBIMAG" style="flex-shrink:0; border-radius:50%; object-fit:cover;">
        <span style="display:flex; flex-direction:column; line-height:1.2; min-width:0;">
          <span style="font-family:'Lora',serif; font-weight:700; font-size:15px; color:#1c2a20; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ nom() }}</span>
          @if (showSubtitle) {
            <span style="font-size:10.5px; font-style:italic; color:#5F6161; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ t('article.sousTitre') }}</span>
          }
        </span>
      </a>
      <a href="#" (click)="goLanding($event)" style="font-size:12.5px; color:#5F6161; white-space:nowrap; text-decoration:none; flex-shrink:0;">{{ t('article.retourActualites') }}</a>
    </div>
  </header>

  <!-- ══ ÉTATS ════════════════════════════════════════════════════════════ -->
  @if (state() === undefined) {
    <!-- Chargement -->
    <div style="display:flex; align-items:center; justify-content:center; min-height:60vh;">
      <div style="width:36px; height:36px; border-radius:50%; border:3px solid #E7E7E5; border-top-color:#008B47;"></div>
    </div>
  } @else if (state()!.kind === 'notFound') {
    <!-- 404 : introuvable ou dépublié -->
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; text-align:center; padding:24px;">
      <p style="font-size:15px; color:#5F6161; margin:0;">{{ t('article.introuvable') }}</p>
      <a href="#" (click)="goLanding($event)" style="color:#008B47; font-weight:700; text-decoration:none;">{{ t('article.retourActualites') }}</a>
    </div>
  } @else if (state()!.kind === 'error') {
    <!-- Erreur réseau -->
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; text-align:center; padding:24px;">
      <p style="font-size:15px; color:#5F6161; margin:0;">{{ t('article.erreur.titre') }}</p>
      <p style="font-size:13.5px; color:#5F6161; margin:0;">{{ t('article.erreur.description') }}</p>
      <a href="#" (click)="goLanding($event)" style="color:#008B47; font-weight:700; text-decoration:none;">{{ t('article.retourAccueil') }}</a>
    </div>
  } @else {

    <!-- ══ HERO ═══════════════════════════════════════════════════════════ -->
    <section style="position:relative; min-height:clamp(300px,42vw,460px); display:flex; align-items:flex-end; overflow:hidden;">
      <div style="position:absolute; inset:0; background:#00532B;"></div>
      <div style="position:absolute; inset:0; background-image:repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 22px);"></div>
      @if (article()!.imageUrl) {
        <img [src]="article()!.imageUrl!" [alt]="article()!.titre"
          style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.32;">
      }
      <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,40,20,0.1) 0%, rgba(0,30,16,0.92) 100%);"></div>
      <div style="position:relative; z-index:2; width:100%; max-width:1180px; margin:0 auto; padding:64px 24px 40px; color:#FFFFFF;">
        <span style="font-size:12.5px; color:rgba(255,255,255,0.75); display:block; margin-bottom:14px;">
          {{ formatDate(article()!.datePublication) }}
        </span>
        <h1 style="font-family:'Lora',serif; font-weight:700; font-size:clamp(26px,4.4vw,46px); line-height:1.14; margin:0; max-width:800px;">
          {{ article()!.titre }}
        </h1>
      </div>
    </section>

    <!-- ══ CORPS DE L'ARTICLE ═════════════════════════════════════════════ -->
    <article style="max-width:760px; margin:0 auto; padding:44px 24px 56px;">
      @for (para of paragraphs(); track $index) {
        @if ($index === 0) {
          <p style="font-family:'Lora',serif; font-size:clamp(17px,2.2vw,21px); line-height:1.55; color:#1c2a20; margin:0 0 28px;">{{ para }}</p>
        } @else {
          <p style="font-size:16px; color:#3d4a41; margin:0 0 22px; line-height:1.75;">{{ para }}</p>
        }
      }
    </article>

    <!-- ══ ARTICLES LIÉS ══════════════════════════════════════════════════ -->
    @if (relatedList().length > 0) {
      <section style="background:#F7F8F6; padding:56px 24px 64px;">
        <div style="max-width:1180px; margin:0 auto;">
          <p style="text-transform:uppercase; letter-spacing:1.5px; font-size:12.5px; font-weight:700; color:#E8722C; margin:0 0 8px;">{{ t('article.related.surtitle') }}</p>
          <h2 style="font-family:'Lora',serif; font-size:clamp(22px,3vw,28px); color:#1c2a20; margin:0 0 28px; font-weight:600;">{{ t('article.related.titre') }}</h2>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
            @for (item of relatedList(); track item.id) {
              <div style="background:#FFFFFF; border:1px solid #E7E7E5; border-radius:4px; overflow:hidden; display:flex; flex-direction:column;">
                <div style="aspect-ratio:16/10; background:repeating-linear-gradient(45deg, rgba(0,139,71,0.08) 0px, rgba(0,139,71,0.08) 10px, transparent 10px, transparent 20px), #F0F1EF; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                  @if (item.imageUrl) {
                    <img [src]="item.imageUrl" [alt]="item.titre" style="width:100%; height:100%; object-fit:cover;">
                  }
                </div>
                <div style="padding:20px; display:flex; flex-direction:column; gap:8px; flex:1;">
                  <span style="font-size:12px; color:#5F6161;">{{ formatDate(item.datePublication) }}</span>
                  <h3 style="font-family:'Lora',serif; font-size:17px; color:#1c2a20; margin:0; font-weight:700; line-height:1.3;">{{ item.titre }}</h3>
                  <p style="font-size:13.5px; margin:0; flex:1;">{{ excerpt(item.contenu) }}</p>
                  <a href="#" (click)="goArticle(item.id, $event)" style="color:#008B47; font-weight:700; font-size:13.5px; margin-top:4px; text-decoration:none;">{{ t('actualites.lireSuite') }}</a>
                </div>
              </div>
            }
          </div>
          <div style="margin-top:32px;">
            <a href="#" (click)="goLanding($event)" style="display:inline-block; border:1.5px solid #008B47; color:#008B47; font-weight:700; font-size:14px; padding:12px 22px; border-radius:2px; text-decoration:none;">{{ t('article.retourAccueil') }}</a>
          </div>
        </div>
      </section>
    }

  }
</div>
</ng-container>
    `
})
export class Article extends CobimagBase {
    private route                = inject(ActivatedRoute);
    private vitrineService       = inject(VitrineService);
    private etablissementService = inject(EtablissementService);

    nom            = this.etablissementService.nom;
    logoUrl        = this.etablissementService.logoUrl;
    displayLogoUrl = computed(() => this.logoUrl() ?? '/assets/logo-cobimag.png');

    // undefined = chargement ; ArticleState = résultat (found / notFound / error)
    readonly state = toSignal<ArticleState>(
        this.route.paramMap.pipe(
            map(p => p.get('id') ?? ''),
            switchMap(id =>
                this.vitrineService.getActualiteById(id).pipe(
                    map(data => ({ kind: 'found' as const, data })),
                    catchError((err: HttpErrorResponse) => of(
                        err.status === 404
                            ? { kind: 'notFound' as const }
                            : { kind: 'error' as const }
                    ))
                )
            )
        )
        // Pas d'initialValue → Signal<ArticleState | undefined> : undefined = chargement
    );

    readonly article = computed(() => {
        const s = this.state();
        return s?.kind === 'found' ? s.data : null;
    });

    readonly paragraphs = computed(() => {
        const art = this.article();
        if (!art) return [] as string[];
        return art.contenu.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    });

    // Articles liés : liste paginée séparée, filtrée pour exclure l'article courant
    private currentId = toSignal(
        this.route.paramMap.pipe(map(p => p.get('id') ?? '')),
        { initialValue: '' }
    );

    private allForRelated = toSignal(
        this.vitrineService.getActualites(0, 4).pipe(catchError(() => of(null)))
    );

    readonly relatedList = computed(() => {
        const all = this.allForRelated();
        if (!all) return [] as ActualiteResponse[];
        return all.content.filter(a => a.id !== this.currentId()).slice(0, 3);
    });

    constructor() {
        super();
        effect(() => {
            const _ = this.currentId();
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        });
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    excerpt(contenu: string, max = 140): string {
        return contenu.length > max ? contenu.substring(0, max).trimEnd() + '…' : contenu;
    }
}
