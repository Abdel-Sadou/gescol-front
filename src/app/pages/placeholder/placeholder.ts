import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-placeholder',
    standalone: true,
    imports: [],
    template: `
        <div class="p-8 text-center">
            <i class="pi pi-wrench" style="font-size:3rem; color:var(--text-color-secondary)"></i>
            <h2 class="text-2xl font-semibold mt-4 mb-2">Module en cours de développement</h2>
            <p class="text-surface-500">Cet écran sera disponible prochainement.</p>
        </div>
    `
})
export class Placeholder {}
