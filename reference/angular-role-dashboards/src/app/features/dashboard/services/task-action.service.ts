import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, from, map } from 'rxjs';

import type { Tache } from '../models/dashboard.models';

/**
 * Exécute l'action d'une tâche de la file « À traiter ».
 * NAVIGUER → ouvre l'écran ; COMMANDE → appelle l'endpoint puis rend la main
 * (le tableau de bord se recharge ensuite).
 */
@Injectable({ providedIn: 'root' })
export class TaskActionService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  run(tache: Tache): Observable<'navigated' | 'executed'> {
    const { action } = tache;

    if (action.type === 'NAVIGUER' && action.route) {
      return from(this.router.navigateByUrl(action.route)).pipe(map(() => 'navigated' as const));
    }

    if (action.type === 'COMMANDE' && action.endpoint) {
      if (action.confirmation && !window.confirm(action.confirmation)) return EMPTY;
      const call =
        action.methode === 'POST'
          ? this.http.post<void>(action.endpoint, {})
          : this.http.put<void>(action.endpoint, {});
      return call.pipe(map(() => 'executed' as const));
    }

    return EMPTY;
  }
}
