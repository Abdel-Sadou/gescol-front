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
    private authService      = inject(AuthService);
    private translocoService = inject(TranslocoService);

    private activeLang = toSignal(this.translocoService.langChanges$, {
        initialValue: this.translocoService.getActiveLang()
    });

    @ViewChild('menuContainer') menuContainer!: ElementRef;

    model = computed(() => {
        const _ = this.activeLang();
        return this.buildMenu(this.authService.role());
    });

    private t(key: string): string {
        return this.translocoService.translate(`app.${key}`);
    }

    // -------------------------------------------------------------------------
    // Sections (objets de menu réutilisables par rôle)
    // -------------------------------------------------------------------------

    private tableauDeBord() {
        return { label: this.t('menu.tableauDeBord'), icon: 'pi pi-home', routerLink: ['/app/tableau-de-bord'] };
    }

    /** Élèves — items filtrés par rôle (ECONOMAT et ENSEIGNANT : liste uniquement) */
    private sectionEleves(role: Role) {
        const items: any[] = [
            { label: this.t('menu.eleves.liste'), icon: 'pi pi-list', routerLink: ['/app/eleves'] },
            { label: this.t('menu.eleves.fiche'), icon: 'pi pi-id-card', routerLink: ['/app/fiche-eleve'] }
        ];
        if (role === 'SUPER_ADMIN' || role === 'SECRETARIAT') {
            items.push({ label: this.t('menu.eleves.nouveau'), icon: 'pi pi-plus', routerLink: ['/app/eleves/nouveau'] });
        }
        return { label: this.t('menu.eleves.label'), icon: 'pi pi-users', items };
    }

    /** Paramétrage complet — SUPER_ADMIN uniquement */
    private sectionParametrage() {
        return {
            label: this.t('menu.parametrage.label'), icon: 'pi pi-cog',
            items: [
                { label: this.t('menu.parametrage.classes'),           icon: 'pi pi-sitemap',    routerLink: ['/app/parametrage/classes'] },
                { label: this.t('menu.parametrage.trimestres'),        icon: 'pi pi-calendar',   routerLink: ['/app/parametrage/trimestres'] },
                { label: this.t('menu.parametrage.tauxScolarite'),     icon: 'pi pi-percentage', routerLink: ['/app/parametrage/taux-scolarite'] },
                { label: this.t('menu.parametrage.quotasHoraires'),    icon: 'pi pi-clock',      routerLink: ['/app/parametrage/quotas-horaires'] },
                { label: this.t('menu.parametrage.matieres'),          icon: 'pi pi-book',       routerLink: ['/app/parametrage/matieres'] },
                { label: this.t('menu.parametrage.coefficients'),      icon: 'pi pi-sort-numeric-up', routerLink: ['/app/parametrage/coefficients'] },
                { label: this.t('menu.parametrage.niveaux'),           icon: 'pi pi-layer-group', routerLink: ['/app/parametrage/niveaux'] },
                { label: this.t('menu.parametrage.modelesEngagement'), icon: 'pi pi-file-edit',  routerLink: ['/app/parametrage/modeles-engagement'] }
            ]
        };
    }

    /** Personnel — filtre "Nouveau" selon rôle */
    private sectionPersonnel(role: Role) {
        const items: any[] = [
            { label: this.t('menu.personnel.liste'), icon: 'pi pi-list', routerLink: ['/app/personnel'] }
        ];
        if (role === 'SUPER_ADMIN' || role === 'SECRETARIAT') {
            items.push({ label: this.t('menu.personnel.nouveau'), icon: 'pi pi-plus', routerLink: ['/app/personnel/nouveau'] });
        }
        return { label: this.t('menu.personnel.label'), icon: 'pi pi-id-card', items };
    }

    /** Emploi du temps — filtre "Nouveau créneau" selon rôle */
    private sectionEmploiDuTemps(role: Role) {
        const items: any[] = [
            { label: this.t('menu.emploiDuTemps.parClasse'),     icon: 'pi pi-calendar', routerLink: ['/app/emploi-du-temps/classe'] },
            { label: this.t('menu.emploiDuTemps.parEnseignant'), icon: 'pi pi-user',     routerLink: ['/app/emploi-du-temps/enseignant'] }
        ];
        if (role === 'SUPER_ADMIN' || role === 'SECRETARIAT') {
            items.push({ label: this.t('menu.emploiDuTemps.nouveauCreneau'), icon: 'pi pi-plus', routerLink: ['/app/emploi-du-temps/nouveau'] });
        }
        return { label: this.t('menu.emploiDuTemps.label'), icon: 'pi pi-calendar', items };
    }

    /** Résultats — filtre saisie/validation selon rôle */
    private sectionResultats(role: Role) {
        const items: any[] = [];
        if (role === 'SUPER_ADMIN' || role === 'ENSEIGNANT') {
            items.push({ label: this.t('menu.resultats.saisie'), icon: 'pi pi-pencil', routerLink: ['/app/resultats/saisie'] });
        }
        if (role === 'SUPER_ADMIN') {
            items.push({ label: this.t('menu.resultats.validation'), icon: 'pi pi-check-circle', routerLink: ['/app/resultats/validation'] });
        }
        items.push({ label: this.t('menu.resultats.bulletins'), icon: 'pi pi-file-pdf', routerLink: ['/app/resultats/bulletins'] });
        return { label: this.t('menu.resultats.label'), icon: 'pi pi-chart-bar', items };
    }

    /** Discipline — items filtrés selon rôle */
    private sectionDiscipline(role: Role) {
        const items: any[] = [
            { label: this.t('menu.discipline.sanctions'), icon: 'pi pi-ban', routerLink: ['/app/discipline/sanctions'] }
        ];
        if (role === 'SUPER_ADMIN' || role === 'SECRETARIAT') {
            items.push({ label: this.t('menu.discipline.bonsSortie'), icon: 'pi pi-sign-out', routerLink: ['/app/discipline/bons-sortie'] });
        }
        if (role === 'SUPER_ADMIN') {
            items.push({ label: this.t('menu.discipline.regles'), icon: 'pi pi-sliders-h', routerLink: ['/app/discipline/regles'] });
        }
        return { label: this.t('menu.discipline.label'), icon: 'pi pi-ban', items };
    }

    /** Finances — items filtrés selon rôle */
    private sectionFinances(role: Role) {
        const items: any[] = [];
        if (role === 'SUPER_ADMIN' || role === 'ECONOMAT') {
            items.push({ label: this.t('menu.finances.versements'), icon: 'pi pi-wallet', routerLink: ['/app/finances/versements'] });
            items.push({ label: this.t('menu.finances.validationsBancaires'), icon: 'pi pi-building-columns', routerLink: ['/app/finances/validations'] });
        }
        items.push({ label: this.t('menu.finances.moratoires'), icon: 'pi pi-calendar-times', routerLink: ['/app/finances/moratoires'] });
        if (role === 'SUPER_ADMIN' || role === 'ECONOMAT') {
            items.push({ label: this.t('menu.finances.alertes'), icon: 'pi pi-bell', routerLink: ['/app/finances/alertes'] });
        }
        items.push({ label: this.t('menu.finances.etats'), icon: 'pi pi-chart-bar', routerLink: ['/app/finances/etats'] });
        return { label: this.t('menu.finances.label'), icon: 'pi pi-wallet', items };
    }

    /** Paie — items filtrés selon rôle */
    private sectionPaie(role: Role) {
        const items: any[] = [];
        if (role === 'SUPER_ADMIN') {
            items.push({ label: this.t('menu.paie.baremes'), icon: 'pi pi-sliders-h', routerLink: ['/app/paie/baremes'] });
        }
        items.push({ label: this.t('menu.paie.bulletins'), icon: 'pi pi-file', routerLink: ['/app/paie/bulletins'] });
        return { label: this.t('menu.paie.label'), icon: 'pi pi-money-bill', items };
    }

    /** Cahier de texte — items filtrés selon rôle */
    private sectionCahierDeTexte(role: Role) {
        const items: any[] = [];
        if (role === 'ENSEIGNANT' || role === 'SUPER_ADMIN') {
            items.push({ label: this.t('menu.cahierDeTexte.maProgression'), icon: 'pi pi-pencil', routerLink: ['/app/cahier-texte/saisie'] });
        }
        items.push({ label: this.t('menu.cahierDeTexte.consultation'), icon: 'pi pi-eye', routerLink: ['/app/cahier-texte/consultation'] });
        if (role === 'SUPER_ADMIN') {
            items.push({ label: this.t('menu.cahierDeTexte.validation'), icon: 'pi pi-check-square', routerLink: ['/app/cahier-texte/validation'] });
        }
        return { label: this.t('menu.cahierDeTexte.label'), icon: 'pi pi-book', items };
    }

    /** Communication */
    private sectionCommunication() {
        return {
            label: this.t('menu.communication.label'), icon: 'pi pi-megaphone',
            items: [
                { label: this.t('menu.communication.actualites'), icon: 'pi pi-newspaper', routerLink: ['/app/communication/actualites'] },
                { label: this.t('menu.communication.calendrier'), icon: 'pi pi-calendar',  routerLink: ['/app/communication/calendrier'] },
                { label: this.t('menu.communication.contenu'),    icon: 'pi pi-globe',     routerLink: ['/app/communication/contenu'] },
                { label: this.t('menu.communication.equipe'),     icon: 'pi pi-users',     routerLink: ['/app/communication/equipe'] }
            ]
        };
    }

    // -------------------------------------------------------------------------
    // Assemblage par rôle
    // -------------------------------------------------------------------------

    private buildMenu(role: Role | null): any[] {
        const base = [this.tableauDeBord(), SEP];
        if (!role) return [this.tableauDeBord()];

        switch (role) {
            case 'SUPER_ADMIN':
                return [
                    ...base,
                    this.sectionEleves(role), this.sectionParametrage(), SEP,
                    this.sectionPersonnel(role), SEP,
                    this.sectionEmploiDuTemps(role), this.sectionResultats(role),
                    this.sectionDiscipline(role), SEP,
                    this.sectionFinances(role), this.sectionPaie(role), SEP,
                    this.sectionCahierDeTexte(role), SEP,
                    this.sectionCommunication()
                ];

            case 'SECRETARIAT':
                return [
                    ...base,
                    this.sectionEleves(role), SEP,
                    this.sectionPersonnel(role), SEP,
                    this.sectionEmploiDuTemps(role), this.sectionResultats(role),
                    this.sectionDiscipline(role), SEP,
                    this.sectionFinances(role), SEP,
                    this.sectionCahierDeTexte(role)
                ];

            case 'ECONOMAT':
                return [
                    ...base,
                    this.sectionEleves(role), SEP,
                    this.sectionPersonnel(role), SEP,
                    this.sectionFinances(role), this.sectionPaie(role)
                ];

            case 'ENSEIGNANT':
                return [
                    ...base,
                    this.sectionEleves(role), SEP,
                    this.sectionEmploiDuTemps(role), this.sectionResultats(role),
                    this.sectionDiscipline(role), SEP,
                    this.sectionCahierDeTexte(role)
                ];

            case 'COMMUNICATION':
                return [...base, this.sectionCommunication()];

            default:
                return [this.tableauDeBord()];
        }
    }
}
