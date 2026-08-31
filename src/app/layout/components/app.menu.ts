import { Component, ElementRef, inject, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { AppMenuitem } from './app.menuitem';
import { AuthService, Role } from '@/app/core/services/auth.service';

const SEP = { separator: true };

@Component({
    selector: '[app-menu]',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model(); track $index) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul>`
})
export class AppMenu {
    el = inject(ElementRef);
    private authService    = inject(AuthService);
    private translocoService = inject(TranslocoService);

    // Dépendance réactive sur le changement de langue pour régénérer les libellés.
    private activeLang = toSignal(this.translocoService.langChanges$, {
        initialValue: this.translocoService.getActiveLang()
    });

    @ViewChild('menuContainer') menuContainer!: ElementRef;

    model = computed(() => {
        const _ = this.activeLang(); // déclenche le recalcul quand la langue change
        return this.buildMenu(this.authService.role());
    });

    private t(key: string): string {
        return this.translocoService.translate(`app.${key}`);
    }

    private buildMenu(role: Role | null): any[] {
        const tableauDeBord = {
            label: this.t('menu.tableauDeBord'),
            icon: 'pi pi-home',
            routerLink: ['/app/tableau-de-bord']
        };
        const eleves = {
            label: this.t('menu.eleves.label'),
            icon: 'pi pi-users',
            items: [
                { label: this.t('menu.eleves.liste'),          icon: 'pi pi-list',    routerLink: ['/app/eleves'] },
                { label: this.t('menu.eleves.fiche'),          icon: 'pi pi-id-card', routerLink: ['/app/fiche-eleve'] },
                { label: this.t('menu.eleves.inscriptions'),   icon: 'pi pi-file',    routerLink: ['/app/inscriptions'] }
            ]
        };
        const finances = {
            label: this.t('menu.finances.label'),
            icon: 'pi pi-wallet',
            items: [
                { label: this.t('menu.finances.scolarite'),  icon: 'pi pi-credit-card', routerLink: ['/app/finances'] },
                { label: this.t('menu.finances.quittances'), icon: 'pi pi-receipt',     routerLink: ['/app/finances'] },
                { label: this.t('menu.finances.moratoires'), icon: 'pi pi-calendar',    routerLink: ['/app/finances'] }
            ]
        };
        const paie = {
            label: this.t('menu.paie.label'),
            icon: 'pi pi-money-bill',
            items: [
                { label: this.t('menu.paie.baremes'),  icon: 'pi pi-sliders-h', routerLink: ['/app/paie'] },
                { label: this.t('menu.paie.bulletins'), icon: 'pi pi-file',    routerLink: ['/app/paie'] }
            ]
        };
        const personnel = {
            label: this.t('menu.personnel'),
            icon: 'pi pi-id-card',
            routerLink: ['/app/personnel']
        };
        const parametrage = {
            label: this.t('menu.parametrage.label'),
            icon: 'pi pi-cog',
            items: [
                { label: this.t('menu.parametrage.classes'),        icon: 'pi pi-sitemap',    routerLink: ['/app/parametrage'] },
                { label: this.t('menu.parametrage.taux'),           icon: 'pi pi-percentage', routerLink: ['/app/parametrage'] },
                { label: this.t('menu.parametrage.matieres'),       icon: 'pi pi-book',       routerLink: ['/app/parametrage'] },
                { label: this.t('menu.parametrage.emploisDuTemps'), icon: 'pi pi-calendar',   routerLink: ['/app/parametrage'] }
            ]
        };
        const emploiDuTemps = {
            label: this.t('menu.emploiDuTemps'),
            icon: 'pi pi-calendar',
            routerLink: ['/app/emploi-du-temps']
        };
        const resultats = {
            label: this.t('menu.resultats.label'),
            icon: 'pi pi-chart-bar',
            items: [
                { label: this.t('menu.resultats.saisie'),   icon: 'pi pi-pencil',   routerLink: ['/app/resultats'] },
                { label: this.t('menu.resultats.bulletins'), icon: 'pi pi-file-pdf', routerLink: ['/app/resultats'] }
            ]
        };
        const discipline = {
            label: this.t('menu.discipline'),
            icon: 'pi pi-ban',
            routerLink: ['/app/discipline']
        };
        const cahierDeTexte = {
            label: this.t('menu.cahierDeTexte'),
            icon: 'pi pi-book',
            routerLink: ['/app/cahier-de-texte']
        };
        const communication = {
            label: this.t('menu.communication.label'),
            icon: 'pi pi-megaphone',
            items: [
                { label: this.t('menu.communication.actualites'), icon: 'pi pi-newspaper', routerLink: ['/app/communication'] },
                { label: this.t('menu.communication.vitrine'),    icon: 'pi pi-globe',     routerLink: ['/app/communication'] }
            ]
        };

        const base = [tableauDeBord, SEP];

        switch (role) {
            case 'SUPER_ADMIN':
                return [...base, eleves, SEP, finances, paie, SEP, personnel, parametrage, SEP, emploiDuTemps, resultats, discipline, SEP, cahierDeTexte, SEP, communication];
            case 'SECRETARIAT':
                return [...base, eleves];
            case 'ECONOMAT':
                return [...base, finances, SEP, paie];
            case 'ENSEIGNANT':
                return [...base, emploiDuTemps, SEP, resultats, discipline, SEP, cahierDeTexte];
            case 'COMMUNICATION':
                return [...base, communication];
            default:
                return [tableauDeBord];
        }
    }
}
