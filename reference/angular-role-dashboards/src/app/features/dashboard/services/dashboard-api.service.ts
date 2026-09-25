import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import type {
  CommunicationDashboard,
  DirectionDashboard,
  EconomatDashboard,
  EnseignantDashboard,
  SecretariatDashboard,
} from '../models/dashboard.models';
import { MOCK } from '../data/dashboard.mock';

/** Base de l'API. Surchargée dans app.config.ts si besoin. */
export const DASHBOARD_API_BASE = new InjectionToken<string>('DASHBOARD_API_BASE', {
  factory: () => '/api/tableau-de-bord',
});

/** true = données statiques (maquette). Passer à false une fois le backend prêt. */
export const DASHBOARD_USE_MOCK = new InjectionToken<boolean>('DASHBOARD_USE_MOCK', {
  factory: () => true,
});

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(DASHBOARD_API_BASE);
  private readonly useMock = inject(DASHBOARD_USE_MOCK);

  direction(): Observable<DirectionDashboard> {
    return this.get('direction', MOCK.direction);
  }

  secretariat(): Observable<SecretariatDashboard> {
    return this.get('secretariat', MOCK.secretariat);
  }

  economat(): Observable<EconomatDashboard> {
    return this.get('economat', MOCK.economat);
  }

  enseignant(): Observable<EnseignantDashboard> {
    return this.get('enseignant', MOCK.enseignant);
  }

  communication(): Observable<CommunicationDashboard> {
    return this.get('communication', MOCK.communication);
  }

  private get<T>(path: string, mock: T): Observable<T> {
    return this.useMock ? of(mock).pipe(delay(350)) : this.http.get<T>(`${this.base}/${path}`);
  }
}
