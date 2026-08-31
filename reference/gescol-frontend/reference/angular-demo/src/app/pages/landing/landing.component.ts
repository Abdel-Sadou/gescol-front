import { Component } from '@angular/core';
import { CobimagBase } from '../../shared/cobimag-base';
import { ARTICLES, CYCLES, PRESENTATION, STATS, STEPS, SYSTEM_EN, SYSTEM_FR, VIE_SCOLAIRE } from '../../data/school-data';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.component.html',
})
export class LandingComponent extends CobimagBase {
  /** Options d'affichage (équivalent des « tweaks » de la maquette). */
  primarySystemFirst: 'Francophone' | 'Anglophone' = 'Francophone';
  showTopBar = true;
  cyclesLayout: 'Cartes' | 'Tableau' = 'Cartes';

  menuOpen = false;
  toggleMenu = (e?: Event) => { e?.preventDefault(); this.menuOpen = !this.menuOpen; };
  closeMenu = (e?: Event) => { this.menuOpen = false; };

  stats = STATS;
  presentation = PRESENTATION;
  cycles = CYCLES;
  vieScolaire = VIE_SCOLAIRE;
  get news() { return ARTICLES.map(a => ({ ...a, open: this.goArticle(a.id) })); }
  steps = STEPS;

  get systems() {
    return this.primarySystemFirst === 'Anglophone' ? [SYSTEM_EN, SYSTEM_FR] : [SYSTEM_FR, SYSTEM_EN];
  }
  get cyclesLayoutIsCards() { return this.cyclesLayout === 'Cartes'; }
  get cyclesLayoutIsTable() { return this.cyclesLayout === 'Tableau'; }
  get showDesktopNav() { return !this.isMobile; }
  get showMobileToggle() { return this.isMobile; }
  get showMobileMenu() { return this.isMobile && this.menuOpen; }

  get navLinks() {
    return [
      { href: '#accueil', label: 'Accueil', onClick: this.noop },
      { href: '#ecole', label: "L'École", onClick: this.noop },
      { href: '#formations', label: 'Formations', onClick: this.noop },
      { href: '#vie-scolaire', label: 'Vie scolaire', onClick: this.noop },
      { href: '#actualites', label: 'Actualités', onClick: this.noop },
      { href: '#', label: 'Portail Parent', onClick: this.goConnexion },
      { href: '#contact', label: 'Contact', onClick: this.noop },
    ];
  }
}
