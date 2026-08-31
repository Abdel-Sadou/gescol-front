import { APP_INITIALIZER, ApplicationConfig, isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import { provideTransloco } from '@jsverse/transloco';
import { appRoutes } from './app.routes';
import { EtablissementService } from '@/app/core/services/etablissement.service';
import { LanguageService } from '@/app/core/services/language.service';
import { TranslocoHttpLoader } from '@/app/core/transloco-loader';
import { authInterceptor } from '@/app/core/interceptors/auth.interceptor';

// Palette COBIMAG initiale (#008B47) — valeur de bootstrap codée en dur.
// EtablissementService.load() appelle updatePreset() dès que l'API répond
// et peut la remplacer par les couleurs réelles de l'établissement.
// Uniquement pour la zone Application interne (ADR-011).
const CobimagPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50:  '#f0faf5',
            100: '#dcf3e9',
            200: '#b8e8d2',
            300: '#7ed4b0',
            400: '#3db88a',
            500: '#008B47',
            600: '#007a3e',
            700: '#006534',
            800: '#00532b',
            900: '#003d1f',
            950: '#001f10'
        },
        overlay: {
            modal:   { borderRadius: '1.5rem' },
            popover: { borderRadius: '10px' }
        },
        colorScheme: {
            light: {
                surface: {
                    0:   'color-mix(in srgb, {primary.950}, white 100%)',
                    50:  'color-mix(in srgb, {primary.950}, white 95%)',
                    100: 'color-mix(in srgb, {primary.950}, white 90%)',
                    200: 'color-mix(in srgb, {primary.950}, white 80%)',
                    300: 'color-mix(in srgb, {primary.950}, white 70%)',
                    400: 'color-mix(in srgb, {primary.950}, white 60%)',
                    500: 'color-mix(in srgb, {primary.950}, white 50%)',
                    600: 'color-mix(in srgb, {primary.950}, white 40%)',
                    700: 'color-mix(in srgb, {primary.950}, white 30%)',
                    800: 'color-mix(in srgb, {primary.950}, white 20%)',
                    900: 'color-mix(in srgb, {primary.950}, white 10%)',
                    950: 'color-mix(in srgb, {primary.950}, white 5%)'
                }
            },
            dark: {
                surface: {
                    0:   'color-mix(in srgb, var(--surface-ground), white 100%)',
                    50:  'color-mix(in srgb, var(--surface-ground), white 95%)',
                    100: 'color-mix(in srgb, var(--surface-ground), white 90%)',
                    200: 'color-mix(in srgb, var(--surface-ground), white 80%)',
                    300: 'color-mix(in srgb, var(--surface-ground), white 70%)',
                    400: 'color-mix(in srgb, var(--surface-ground), white 60%)',
                    500: 'color-mix(in srgb, var(--surface-ground), white 50%)',
                    600: 'color-mix(in srgb, var(--surface-ground), white 40%)',
                    700: 'color-mix(in srgb, var(--surface-ground), white 30%)',
                    800: 'color-mix(in srgb, var(--surface-ground), white 20%)',
                    900: 'color-mix(in srgb, var(--surface-ground), white 10%)',
                    950: 'color-mix(in srgb, var(--surface-ground), white 5%)'
                }
            }
        }
    }
});

function initApp(etablissementService: EtablissementService, langService: LanguageService) {
    return async () => {
        await Promise.all([
            etablissementService.load(),
            langService.preload(langService.currentLang())
        ]);
    };
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            appRoutes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
            withEnabledBlockingInitialNavigation()
        ),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideZonelessChangeDetection(),
        providePrimeNG({ theme: { preset: CobimagPreset, options: { darkModeSelector: '.app-dark' } } }),
        provideTransloco({
            config: {
                availableLangs: ['fr', 'en'],
                defaultLang: 'fr',
                reRenderOnLangChange: true,
                prodMode: !isDevMode()
            },
            loader: TranslocoHttpLoader
        }),
        {
            provide: APP_INITIALIZER,
            useFactory: initApp,
            deps: [EtablissementService, LanguageService],
            multi: true
        }
    ]
};
