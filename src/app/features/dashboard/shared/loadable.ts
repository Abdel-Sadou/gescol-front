import { Signal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of, startWith, switchMap } from 'rxjs';

export type LoadState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly data: T };

export interface Loadable<T> {
  readonly state: Signal<LoadState<T>>;
  readonly reload: () => void;
}

/**
 * Charge une source et expose son état (chargement / erreur / prêt) sous forme
 * de signal, avec rechargement. À appeler dans un contexte d'injection
 * (initialiseur de champ d'un composant).
 */
export function loadable<T>(source: () => Observable<T>): Loadable<T> {
  const trigger = signal(0);
  const state = toSignal(
    toObservable(trigger).pipe(
      switchMap(() =>
        source().pipe(
          map((data): LoadState<T> => ({ status: 'ready', data })),
          catchError(() => of<LoadState<T>>({ status: 'error' })),
          startWith<LoadState<T>>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as LoadState<T> },
  );
  return { state, reload: () => trigger.update((n) => n + 1) };
}
