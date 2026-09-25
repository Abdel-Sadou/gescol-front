import { Directive, computed, inject, input, signal } from '@angular/core';
import type { Observable } from 'rxjs';

import type { Tache } from '../models/dashboard.models';
import { DashboardApiService } from '../services/dashboard-api.service';
import { TaskActionService } from '../services/task-action.service';
import { loadable } from './loadable';

/**
 * Socle commun aux 5 tableaux de bord : chargement, état, exécution des
 * actions de la file « À traiter » et rechargement après une commande.
 */
@Directive()
export abstract class RoleDashboardBase<T> {
  protected readonly api = inject(DashboardApiService);
  private readonly actions = inject(TaskActionService);

  /** Nom affiché dans l'accueil — fourni par la coque / le service d'authentification. */
  readonly displayName = input<string>('');

  protected abstract fetch(): Observable<T>;

  protected readonly store = loadable(() => this.fetch());
  protected readonly state = this.store.state;
  protected readonly data = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.data : null;
  });
  protected readonly status = computed(() => {
    const s = this.state().status;
    return s === 'ready' ? 'loading' : s;
  });

  protected readonly busyId = signal<string | null>(null);

  protected reload(): void {
    this.store.reload();
  }

  protected onAct(tache: Tache): void {
    this.busyId.set(tache.id);
    this.actions.run(tache).subscribe({
      next: (result) => {
        if (result === 'executed') this.store.reload();
      },
      complete: () => this.busyId.set(null),
      error: () => this.busyId.set(null),
    });
  }
}
