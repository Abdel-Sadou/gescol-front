import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { Role } from './models/dashboard.models';
import { CommunicationDashboardComponent } from './roles/communication-dashboard.component';
import { DirectionDashboardComponent } from './roles/direction-dashboard.component';
import { EconomatDashboardComponent } from './roles/economat-dashboard.component';
import { EnseignantDashboardComponent } from './roles/enseignant-dashboard.component';
import { SecretariatDashboardComponent } from './roles/secretariat-dashboard.component';

/**
 * Point d'entrée du tableau de bord : affiche le contenu du rôle connecté.
 * Se place dans la zone de contenu de la coque (sans sidebar).
 *
 *   <cob-dashboard-home [role]="auth.role()" [displayName]="auth.displayName()" />
 */
@Component({
  selector: 'cob-dashboard-home',
  imports: [
    DirectionDashboardComponent,
    SecretariatDashboardComponent,
    EconomatDashboardComponent,
    EnseignantDashboardComponent,
    CommunicationDashboardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (role()) {
      @case ('SUPER_ADMIN') { <cob-direction-dashboard [displayName]="displayName()" /> }
      @case ('SECRETARIAT') { <cob-secretariat-dashboard [displayName]="displayName()" /> }
      @case ('ECONOMAT') { <cob-economat-dashboard [displayName]="displayName()" /> }
      @case ('ENSEIGNANT') { <cob-enseignant-dashboard [displayName]="displayName()" /> }
      @case ('COMMUNICATION') { <cob-communication-dashboard [displayName]="displayName()" /> }
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 1360px;
      padding: 24px 26px 40px;
    }
    @media (max-width: 620px) {
      :host { padding: 16px; }
    }
  `,
})
export class DashboardHomeComponent {
  readonly role = input.required<Role>();
  /** Ex. « Madame Ateba » — laissé vide, chaque rôle a une formule par défaut. */
  readonly displayName = input('');
}
