import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { updatePreset } from '@primeuix/themes';
import { firstValueFrom } from 'rxjs';

interface EtablissementDto {
    id: string;
    nom: string;
    nomCourt: string | null;
    logoUrl: string | null;
    couleurPrimaire: string;
    couleurSecondaire: string;
    couleurAccent: string;
}

const FALLBACK = {
    nom:               'COBIMAG',
    nomCourt:          null as string | null,
    logoUrl:           null as string | null,
    couleurPrimaire:   '#008B47',
    couleurSecondaire: '#5F6161',
    couleurAccent:     '#E8722C'
};

@Injectable({ providedIn: 'root' })
export class EtablissementService {
    private http = inject(HttpClient);

    readonly nom     = signal<string>(FALLBACK.nom);
    readonly nomCourt = signal<string | null>(FALLBACK.nomCourt);
    readonly logoUrl = signal<string | null>(FALLBACK.logoUrl);

    async load(): Promise<void> {
        try {
            const etab = await firstValueFrom(
                this.http.get<EtablissementDto>('/api/etablissement/courant')
            );
            this.nom.set(etab.nom ?? FALLBACK.nom);
            this.nomCourt.set(etab.nomCourt ?? null);
            this.logoUrl.set(etab.logoUrl ?? null);
            this.applyBranding(etab.couleurPrimaire, etab.couleurSecondaire, etab.couleurAccent);
        } catch {
            this.applyBranding(FALLBACK.couleurPrimaire, FALLBACK.couleurSecondaire, FALLBACK.couleurAccent);
        }
    }

    private applyBranding(primary: string, secondary: string, accent: string): void {
        const root = document.documentElement;

        // Variables CSS — Vitrine et Espace Parent
        root.style.setProperty('--color-primary',      primary);
        root.style.setProperty('--color-secondary',    secondary);
        root.style.setProperty('--color-accent',       accent);
        root.style.setProperty('--color-primary-dark', this.darken(primary, 0.40));
        root.style.setProperty('--color-primary-light', this.lighten(primary, 0.90));

        // Preset PrimeNG — Application interne uniquement
        updatePreset({ semantic: { primary: this.buildPalette(primary) } });
    }

    private buildPalette(hex: string): Record<string, string> {
        return {
            50:  this.lighten(hex, 0.92),
            100: this.lighten(hex, 0.84),
            200: this.lighten(hex, 0.70),
            300: this.lighten(hex, 0.50),
            400: this.lighten(hex, 0.25),
            500: hex,
            600: this.darken(hex, 0.12),
            700: this.darken(hex, 0.25),
            800: this.darken(hex, 0.40),
            900: this.darken(hex, 0.55),
            950: this.darken(hex, 0.70)
        };
    }

    private lighten(hex: string, ratio: number): string {
        const [r, g, b] = this.parseHex(hex);
        return this.toHex(
            Math.round(r + (255 - r) * ratio),
            Math.round(g + (255 - g) * ratio),
            Math.round(b + (255 - b) * ratio)
        );
    }

    private darken(hex: string, ratio: number): string {
        const [r, g, b] = this.parseHex(hex);
        return this.toHex(
            Math.round(r * (1 - ratio)),
            Math.round(g * (1 - ratio)),
            Math.round(b * (1 - ratio))
        );
    }

    private parseHex(hex: string): [number, number, number] {
        const h = hex.replace('#', '');
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }

    private toHex(r: number, g: number, b: number): string {
        return '#' + [r, g, b].map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('');
    }
}
