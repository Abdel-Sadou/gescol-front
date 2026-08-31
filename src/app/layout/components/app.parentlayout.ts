import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageSwitcher } from '@/app/shared/components/language-switcher/language-switcher';

// Layout minimal — ADR-011, zéro PrimeNG.
// Mini-barre supérieure positionnée pour accueillir le sélecteur de langue
// sur toutes les pages de l'Espace Parent (pages à construire en PROMPT_F04+).
@Component({
    selector: 'app-parent-layout',
    standalone: true,
    imports: [RouterModule, LanguageSwitcher],
    template: `
        <div style="position:fixed; top:0; right:0; z-index:100; padding:10px 20px;">
            <app-language-switcher variant="light" />
        </div>
        <router-outlet />
    `
})
export class ParentLayout {}
