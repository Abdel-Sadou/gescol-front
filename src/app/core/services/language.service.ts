import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

export type Lang = 'fr' | 'en';

const LANG_KEY = 'gescol_lang';
const SCOPES   = ['vitrine', 'parent', 'app'] as const;

@Injectable({ providedIn: 'root' })
export class LanguageService {
    private transloco = inject(TranslocoService);

    readonly currentLang = signal<Lang>('fr');
    readonly switching   = signal(false);

    constructor() {
        const stored = localStorage.getItem(LANG_KEY);
        const lang: Lang = stored === 'en' ? 'en' : 'fr';
        this.currentLang.set(lang);
        this.transloco.setActiveLang(lang);
    }

    async preload(lang: Lang): Promise<void> {
        await Promise.all(
            SCOPES.map(scope => firstValueFrom(this.transloco.load(`${scope}/${lang}`)))
        );
    }

    setLang(lang: Lang): void {
        if (lang === this.currentLang()) return;
        localStorage.setItem(LANG_KEY, lang);
        // Charger tous les scopes avant de changer la langue active —
        // sinon Transloco re-rend les composants avant que les fichiers
        // soient en cache et affiche les clés brutes.
        this.switching.set(true);
        this.preload(lang).then(() => {
            this.currentLang.set(lang);
            this.transloco.setActiveLang(lang);
            this.switching.set(false);
        });
    }
}
