import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable } from 'rxjs';

// Résout les fichiers scopés (ex: 'vitrine/fr') et globaux ('fr')
// vers /assets/i18n/{path}.json
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
    private http = inject(HttpClient);

    getTranslation(lang: string): Observable<Translation> {
        return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
    }
}
