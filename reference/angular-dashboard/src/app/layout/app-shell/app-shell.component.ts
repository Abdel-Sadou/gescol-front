import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { IconComponent } from '../../shared/icon/icon.component';
import { ICONS } from '../../core/icons';
import { CURRENT_USER, NAV_GROUPS, NOTIFICATION_COUNT, SCHOOL_YEAR } from '../../data/school-data';

type Lang = 'FR' | 'EN';

/**
 * Coque applicative : sidebar (logo, navigation, sélecteur FR/EN) +
 * barre du haut (recherche, notifications, profil), avec une zone de
 * contenu centrale où est projeté n'importe quel écran (<router-outlet>).
 */
@Component({
  selector: 'cob-app-shell',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  protected readonly navGroups = NAV_GROUPS;
  protected readonly user = CURRENT_USER;
  protected readonly schoolYear = SCHOOL_YEAR;
  protected readonly notificationCount = NOTIFICATION_COUNT;
  protected readonly searchIcon = ICONS['search'];
  protected readonly bellIcon = ICONS['bell'];

  /** Titre de la page courante — à brancher sur le routeur ensuite. */
  protected readonly pageTitle = signal('Tableau de bord');
  protected readonly pageSubtitle = signal('Mercredi 2 septembre 2026 · Rentrée J+1');

  protected readonly lang = signal<Lang>('FR');
  protected setLang(next: Lang): void {
    this.lang.set(next);
  }
}
