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
        this.currentLang.set(lang);
        localStorage.setItem(LANG_KEY, lang);
        this.transloco.setActiveLang(lang);
        // Précharger les scopes de la nouvelle langue (Transloco met en cache)
        SCOPES.forEach(scope => this.transloco.load(`${scope}/${lang}`).subscribe());
    }
}
