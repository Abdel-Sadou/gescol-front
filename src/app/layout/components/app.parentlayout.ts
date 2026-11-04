import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// Layout minimal — ADR-011, zéro PrimeNG.
// Le sélecteur de langue est intégré directement dans le header de chaque page parente.
@Component({
    selector: 'app-parent-layout',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet />`
})
export class ParentLayout {}
