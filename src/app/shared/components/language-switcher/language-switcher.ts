import { Component, Input, inject } from '@angular/core';
import { LanguageService, Lang } from '@/app/core/services/language.service';

// HTML natif, zéro PrimeNG — utilisable dans les trois zones (ADR-011).
// variant 'light' : texte sombre sur fond clair (nav Vitrine, topbar Parent)
// variant 'dark'  : texte blanc sur fond sombre (footer Vitrine, etc.)
// variant 'app'   : style discret adapté à la topbar Poseidon
@Component({
    selector: 'app-language-switcher',
    standalone: true,
    imports: [],
    template: `
        <div style="display:inline-flex; align-items:center; gap:0; position:relative;">
            <button
                (click)="set('fr')"
                [disabled]="switching()"
                [style.fontWeight]="lang() === 'fr' ? '700' : '400'"
                [style.color]="activeColor()"
                [style.opacity]="switching() ? '0.4' : (lang() === 'fr' ? '1' : '0.55')"
                [style.cursor]="switching() ? 'wait' : 'pointer'"
                style="background:none; border:none; font-family:'Work Sans',sans-serif; font-size:12px; padding:4px 6px; letter-spacing:0.5px; transition:opacity 0.15s;">
                FR
            </button>
            <span [style.color]="sepColor()" style="font-size:11px; user-select:none;">|</span>
            <button
                (click)="set('en')"
                [disabled]="switching()"
                [style.fontWeight]="lang() === 'en' ? '700' : '400'"
                [style.color]="activeColor()"
                [style.opacity]="switching() ? '0.4' : (lang() === 'en' ? '1' : '0.55')"
                [style.cursor]="switching() ? 'wait' : 'pointer'"
                style="background:none; border:none; font-family:'Work Sans',sans-serif; font-size:12px; padding:4px 6px; letter-spacing:0.5px; transition:opacity 0.15s;">
                EN
            </button>
        </div>
    `
})
export class LanguageSwitcher {
    @Input() variant: 'light' | 'dark' | 'app' = 'light';

    private langService = inject(LanguageService);
    lang      = this.langService.currentLang;
    switching = this.langService.switching;

    set(l: Lang): void { this.langService.setLang(l); }

    activeColor(): string {
        if (this.variant === 'dark') return 'rgba(255,255,255,0.9)';
        if (this.variant === 'app')  return 'var(--text-color, #1c2a20)';
        return '#1c2a20';
    }

    sepColor(): string {
        if (this.variant === 'dark') return 'rgba(255,255,255,0.3)';
        if (this.variant === 'app')  return 'var(--text-color-secondary, #5F6161)';
        return '#C9CBC9';
    }
}
