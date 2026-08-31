import { Router } from '@angular/router';
import { inject, Injectable, OnDestroy } from '@angular/core';

/**
 * Comportements partagés par tous les écrans : navigation, largeur de fenêtre
 * (adaptations responsive) et helpers de mise en forme.
 */
@Injectable()
export abstract class CobimagBase implements OnDestroy {
  protected router = inject(Router);
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  private onResize = () => { this.viewportWidth = window.innerWidth; };

  constructor() {
    if (typeof window !== 'undefined') window.addEventListener('resize', this.onResize);
  }
  ngOnDestroy(): void {
    if (typeof window !== 'undefined') window.removeEventListener('resize', this.onResize);
  }

  get isMobile(): boolean { return this.viewportWidth < 1080; }
  get isNarrow(): boolean { return this.viewportWidth < 480; }
  get showSubtitle(): boolean { return !this.isNarrow; }
  get logoHeaderSize(): number { return this.isNarrow ? 38 : 50; }
  get logoParentSize(): number { return this.isNarrow ? 34 : 42; }
  get logoFicheSize(): number { return this.isNarrow ? 32 : 38; }

  private nav(path: string) {
    return (e?: Event) => { e?.preventDefault(); this.router.navigateByUrl(path); };
  }
  goLanding = this.nav('/');
  goConnexion = this.nav('/connexion');
  goEspaceParent = this.nav('/espace-parent');
  goQuittance = this.nav('/quittance');
  goFiche = this.nav('/secretariat');
  noop = (e?: Event) => { e?.preventDefault(); };
}
