import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';

import { AppComponent } from './app/app.component';
import { CobimagPreset } from './app/theme/cobimag-preset';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: CobimagPreset,
        options: {
          darkModeSelector: false,
          // Les styles COBIMAG doivent gagner sur les styles de base PrimeNG.
          cssLayer: { name: 'primeng', order: 'theme, base, primeng, cobimag' },
        },
      },
      ripple: false,
    }),
  ],
}).catch((err) => console.error(err));
