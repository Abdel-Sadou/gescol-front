import { inject, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

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
    goLanding             = this.nav('/vitrine');
    goConnexion           = this.nav('/connexion');
    goParent              = this.nav('/parent');
    goQuittance           = this.nav('/parent/quittance');
    goFiche               = this.nav('/app/fiche-eleve');
    goNouvelleInscription = this.nav('/parent/inscription/nouvelle');
    goMesInscriptions     = this.nav('/parent/inscription/mes-inscriptions');
    noop        = (e?: Event) => { e?.preventDefault(); };
    goQuittanceDetail(versementId: string, eleveId: string, classeLibelle = '', e?: Event): void {
        e?.preventDefault();
        this.router.navigate(['/parent/quittance', versementId], { queryParams: { eleveId, cl: classeLibelle } });
    }
    goArticle(id: string, e?: Event): void { e?.preventDefault(); this.router.navigate(['/vitrine/actualites', id]); }
    scrollTo(e: Event, id: string): void {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
