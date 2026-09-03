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
        formField: {
            borderRadius:            'var(--radius-sm)',
            background:              'var(--color-field-bg)',
            disabledBackground:      'var(--color-surface-sunken)',
            borderColor:             'var(--color-border-field)',
            hoverBorderColor:        'var(--color-primary-border)',
            focusBorderColor:        'var(--color-primary)',
            color:                   'var(--color-text-body)',
            disabledColor:           'var(--color-text-muted)',
            placeholderColor:        'var(--color-placeholder)',
            invalidPlaceholderColor: 'var(--color-placeholder)',
            focusRing: {
                width:  '2px',
                style:  'solid',
                color:  'var(--color-primary-soft-ring)',
                offset: '1px',
            },
        },
        overlay: {
            modal:   { borderRadius: '1.5rem' },
            popover: { borderRadius: '10px' }
        },
        colorScheme: {
            light: {
                surface: {
                    0:   '#ffffff',
                    50:  '#fffdf8',
                    100: '#fbf8f2',
                    200: '#f4efe4',
                    300: '#f1eadc',
                    400: '#e9e1d2',
                    500: '#e2dacb',
                    600: '#d4c9b4',
                    700: '#c0b09a',
                    800: '#a09080',
                    900: '#736a5c',
                    950: '#4a3f34'
                },
                /* Surbrillance : cercle plein vert pour la date du jour et la sélection */
                highlight: {
                    background:      '{primary.500}',
                    focusBackground: '{primary.600}',
                    color:           '#ffffff',
                    focusColor:      '#ffffff',
                },
                /* Fond chaud pour tous les overlays (Select, DatePicker, etc.) */
                content: {
                    background:      'var(--color-surface)',
                    hoverBackground: 'var(--color-surface-sunken)',
                    borderColor:     'var(--color-border)',
                    color:           'var(--color-text-body)',
                    hoverColor:      'var(--color-text)',
                },
                /* Couleurs de texte par défaut des composants */
                text: {
                    color:           'var(--color-text-body)',
                    hoverColor:      'var(--color-text)',
                    mutedColor:      'var(--color-text-muted)',
                    hoverMutedColor: 'var(--color-text)',
                },
            },
            dark: {
                surface: {
                    0:   '#1a2b22',
                    50:  '#1f3329',
                    100: '#243c30',
                    200: '#2e4a3a',
                    300: '#3a5c48',
                    400: '#476e56',
                    500: '#547f64',
                    600: '#6a9478',
                    700: '#83ab91',
                    800: '#a3c2ae',
                    900: '#c6d9cc',
                    950: '#e4eee7'
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
