import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppShellComponent } from './layout/app-shell/app-shell.component';

/**
 * Racine de l'application : la coque (sidebar + barre du haut) enveloppe
 * le <router-outlet>, projeté dans la zone de contenu de AppShell.
 */
@Component({
  selector: 'cob-root',
  imports: [AppShellComponent, RouterOutlet],
  template: `
    <cob-app-shell>
      <router-outlet />
    </cob-app-shell>
  `,
})
export class AppComponent {}
