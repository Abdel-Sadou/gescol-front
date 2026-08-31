import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// Coquille minimale sans PrimeNG — ADR-011.
// Aucun import de composant Poseidon/PrimeNG.
@Component({
    selector: 'app-vitrine-layout',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet />`
})
export class VitrineLayout {}
