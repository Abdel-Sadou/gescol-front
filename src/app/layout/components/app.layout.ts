import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    computed,
    inject,
    signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService, Role } from '@/app/core/services/auth.service';
import { LanguageService, Lang } from '@/app/core/services/language.service';
import { IconComponent } from '@/app/shared/icon/icon.component';
import { ICONS } from '@/app/shared/icon/icons';
import { PENDING_ALERT_COUNT } from '@/app/data/dashboard-data';

interface NavItem  { label: string; icon: string; routerLink: string; }
interface NavGroup { label: string; items: NavItem[]; }

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterModule, IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <!-- ── Overlay backdrop (mobile only) ───────────────────────────────── -->
        @if (sidebarOverlayOpen()) {
            <div class="overlay-backdrop" (click)="closeSidebar()" aria-hidden="true"></div>
        }

        <div class="shell">
            <!-- ── Sidebar ──────────────────────────────────────────────────── -->
            <aside class="sidebar" [class.is-open]="sidebarOverlayOpen()">

                <a class="brand" routerLink="/app/tableau-de-bord" aria-label="COBIMAG — accueil">
                    <span class="brand__monogram" aria-hidden="true">C</span>
                    <span class="brand__text">
                        <span class="brand__name">COBIMAG</span>
                        <span class="brand__tagline">Gestion scolaire</span>
                    </span>
                </a>

                <hr class="sidebar__rule" />

                <nav class="nav" aria-label="Navigation principale">
                    @for (group of navGroups(); track group.label) {
                        <div class="nav__group">
                            @if (group.label) {
                                <p class="nav__group-label">{{ group.label }}</p>
                            }
                            @for (item of group.items; track item.routerLink) {
                                <a
                                    class="nav__item"
                                    [routerLink]="item.routerLink"
                                    routerLinkActive="nav__item--active"
                                    [routerLinkActiveOptions]="{ exact: false }"
                                    [title]="item.label"
                                    (click)="closeSidebar()"
                                >
                                    <i [class]="item.icon" aria-hidden="true"></i>
                                    <span>{{ item.label }}</span>
                                </a>
                            }
                        </div>
                    }
                </nav>

                <!-- Sélecteur FR / EN -->
                <div class="lang">
                    <div class="lang__pills" role="group" aria-label="Langue">
                        <button
                            type="button"
                            class="lang__pill"
                            [class.lang__pill--on]="currentLang() === 'fr'"
                            [attr.aria-pressed]="currentLang() === 'fr'"
                            (click)="setLang('fr')"
                        >FR</button>
                        <button
                            type="button"
                            class="lang__pill lang__pill--overlap"
                            [class.lang__pill--on]="currentLang() === 'en'"
                            [attr.aria-pressed]="currentLang() === 'en'"
                            (click)="setLang('en')"
                        >EN</button>
                    </div>
                    <span class="lang__year">{{ schoolYear }}</span>
                </div>
            </aside>

            <!-- ── Main : topbar + contenu ──────────────────────────────────── -->
            <div class="main">
                <header class="topbar">
                    <!-- Burger (mobile uniquement) -->
                    <button
                        type="button"
                        class="burger"
                        (click)="toggleSidebar()"
                        aria-label="Ouvrir le menu"
                    >
                        <cob-icon [path]="sidebarOverlayOpen() ? xIcon : menuIcon" [size]="20" />
                    </button>

                    <div class="topbar__heading">
                        <h1 class="topbar__title">{{ pageTitle() }}</h1>
                    </div>

                    <label class="search" aria-label="Rechercher">
                        <cob-icon [path]="searchIcon" [size]="15" [strokeWidth]="2" class="search__icon" />
                        <input
                            class="search__input"
                            type="search"
                            placeholder="Rechercher un élève, une classe…"
                            aria-label="Rechercher"
                        />
                    </label>

                    <div class="topbar__actions">
                        <button type="button" class="notif" aria-label="Notifications ({{ alertCount }})">
                            <cob-icon [path]="bellIcon" [size]="19" />
                            @if (alertCount > 0) {
                                <span class="notif__badge" aria-hidden="true">{{ alertCount }}</span>
                            }
                        </button>

                        <span class="topbar__divider" aria-hidden="true"></span>

                        <div class="profile">
                            <span class="profile__avatar">{{ userInitials() }}</span>
                            <span class="profile__text">
                                <span class="profile__name">{{ userSub() }}</span>
                                <span class="profile__role">{{ userRole() }}</span>
                            </span>
                        </div>
                    </div>
                </header>

                <main class="content">
                    <router-outlet />
                </main>
            </div>
        </div>
    `,
    styles: [`
        /* ── Réinitialisation hôte ─────────────────────────────────────────── */
        :host { display: block; height: 100%; }

        /* ── Structure générale ────────────────────────────────────────────── */
        .shell {
            display: flex;
            height: 100%;
            min-height: 100vh;
            background: var(--color-canvas);
        }

        /* ── Backdrop overlay mobile ────────────────────────────────────────── */
        .overlay-backdrop {
            position: fixed;
            inset: 0;
            z-index: 99;
            background: rgba(23, 61, 42, 0.45);
            backdrop-filter: blur(1px);
        }

        /* ── Sidebar ────────────────────────────────────────────────────────── */
        .sidebar {
            width: var(--shell-sidebar-width);
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            padding: 24px 0 0;
            background: var(--color-primary-dark);
            color: var(--color-text-on-dark);
            overflow-y: auto;
            overflow-x: hidden;
        }

        /* ── Marque ─────────────────────────────────────────────────────────── */
        .brand {
            display: flex;
            align-items: center;
            gap: 11px;
            padding: 0 22px 24px;
            color: inherit;
            text-decoration: none;
        }

        .brand__monogram {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: var(--font-serif);
            font-size: 20px;
            font-weight: 700;
            color: #fff;
            background: var(--color-primary);
            border-radius: var(--radius-full);
            box-shadow: 0 0 0 2px rgba(232, 114, 44, 0.55);
        }

        .brand__text {
            display: flex;
            flex-direction: column;
            line-height: 1.15;
            min-width: 0;
        }

        .brand__name {
            font-family: var(--font-serif);
            font-weight: 700;
            font-size: 16px;
            color: #fff;
        }

        .brand__tagline {
            font-size: 10.5px;
            font-style: italic;
            color: var(--color-text-on-dark-muted);
        }

        .sidebar__rule {
            height: 1px;
            border: 0;
            margin: 0 22px 18px;
            background: var(--color-border-on-dark);
        }

        /* ── Navigation ─────────────────────────────────────────────────────── */
        .nav { flex: 1; }

        .nav__group { margin-bottom: 20px; }

        .nav__group-label {
            margin: 0;
            padding: 0 22px 8px;
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            color: var(--color-text-on-dark-muted);
        }

        .nav__item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 9px 22px;
            font-size: 13.5px;
            font-weight: 500;
            color: var(--color-text-on-dark);
            border-left: 3px solid transparent;
            transition: background 0.15s ease, color 0.15s ease;
            text-decoration: none;
            white-space: nowrap;
        }

        .nav__item i { font-size: 15px; flex-shrink: 0; }

        .nav__item:hover {
            background: rgba(255, 255, 255, 0.06);
            color: #fff;
        }

        .nav__item--active {
            background: rgba(232, 114, 44, 0.16);
            border-left-color: var(--color-accent);
            color: #fff;
        }

        .nav__item--active:hover { background: rgba(232, 114, 44, 0.22); }

        /* ── Sélecteur de langue ────────────────────────────────────────────── */
        .lang {
            margin-top: auto;
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 16px 22px;
            border-top: 1px solid var(--color-border-on-dark);
        }

        .lang__pills { display: inline-flex; }

        .lang__pill {
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
            font-size: 9px;
            font-weight: 700;
            color: var(--color-text-on-dark);
            background: transparent;
            border: 1.5px solid rgba(255, 255, 255, 0.6);
            border-radius: var(--radius-full);
            cursor: pointer;
            transition: background 0.12s;
        }

        .lang__pill--overlap { margin-left: -8px; }

        .lang__pill--on {
            background: var(--color-accent);
            border-color: var(--color-accent);
            color: #fff;
            z-index: 1;
        }

        .lang__year {
            font-size: 11px;
            color: var(--color-text-on-dark-muted);
        }

        /* ── Zone principale ────────────────────────────────────────────────── */
        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        /* ── Topbar ─────────────────────────────────────────────────────────── */
        .topbar {
            height: var(--shell-topbar-height);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 0 26px;
            background: var(--color-surface);
            border-bottom: 1px solid var(--color-border);
        }

        /* Burger masqué par défaut, visible en dessous de 768 px */
        .burger {
            display: none;
            padding: 6px;
            color: var(--color-text-muted);
            background: none;
            border: 0;
            cursor: pointer;
            border-radius: var(--radius-sm);
        }

        .burger:hover { background: var(--color-surface-sunken); color: var(--color-text); }

        .topbar__heading { min-width: 0; }

        .topbar__title {
            margin: 0;
            font-family: var(--font-serif);
            font-size: 19px;
            font-weight: 700;
            color: var(--color-text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .search {
            flex: 1;
            max-width: 340px;
            margin-left: 18px;
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 9px 15px;
            background: var(--color-surface-sunken);
            border: 1px solid var(--color-border-field);
            border-radius: var(--radius-pill);
            cursor: text;
        }

        .search:focus-within { border-color: var(--color-primary); }

        .search__icon { color: var(--color-text-muted); }

        .search__input {
            flex: 1;
            min-width: 0;
            font-family: inherit;
            font-size: 13px;
            color: var(--color-text-body);
            background: none;
            border: 0;
            outline: none;
        }

        .search__input::placeholder { color: var(--color-text-muted); }

        .topbar__actions {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .notif {
            position: relative;
            display: flex;
            padding: 4px;
            color: var(--color-text-muted);
            background: none;
            border: 0;
            cursor: pointer;
            border-radius: var(--radius-sm);
        }

        .notif:hover { color: var(--color-text); }

        .notif__badge {
            position: absolute;
            top: -2px;
            right: -3px;
            min-width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 3px;
            font-size: 9px;
            font-weight: 700;
            color: #fff;
            background: var(--color-accent);
            border: 2px solid var(--color-surface);
            border-radius: var(--radius-full);
        }

        .topbar__divider {
            width: 1px;
            height: 26px;
            background: var(--color-border);
        }

        .profile {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .profile__avatar {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: var(--font-serif);
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            background: var(--color-primary-dark);
            border-radius: var(--radius-full);
        }

        .profile__text {
            display: flex;
            flex-direction: column;
            line-height: 1.2;
        }

        .profile__name {
            font-size: 12.5px;
            font-weight: 600;
            color: var(--color-text);
        }

        .profile__role {
            font-size: 10.5px;
            color: var(--color-text-muted);
        }

        /* ── Contenu ─────────────────────────────────────────────────────────── */
        .content {
            flex: 1;
            min-height: 0;
            padding: 24px 26px;
            overflow-y: auto;
        }

        /* ── Adaptatif ─── tablette (1080 px) ───────────────────────────────── */
        @media (max-width: 1080px) {
            .sidebar { width: 78px; }

            .brand__text,
            .nav__group-label,
            .nav__item span,
            .lang__year,
            .brand__tagline { display: none; }

            .brand,
            .lang { justify-content: center; padding-inline: 0; }

            .nav__item {
                justify-content: center;
                padding-inline: 0;
                border-left-width: 0;
                border-right: 3px solid transparent;
            }

            .nav__item--active { border-right-color: var(--color-accent); }
        }

        /* ── Adaptatif ─── mobile (768 px) ──────────────────────────────────── */
        @media (max-width: 767px) {
            .sidebar {
                position: fixed;
                top: 0;
                left: 0;
                height: 100%;
                z-index: 100;
                width: var(--shell-sidebar-width);
                transform: translateX(-100%);
                transition: transform 0.25s ease, box-shadow 0.25s ease;
            }

            .sidebar.is-open {
                transform: translateX(0);
                box-shadow: var(--shadow-shell);
            }

            /* Remettre les textes masqués à 1080 px */
            .brand__text,
            .nav__group-label,
            .nav__item span,
            .lang__year,
            .brand__tagline { display: revert; }

            .brand { padding: 0 22px 24px; justify-content: flex-start; }
            .lang  { padding: 16px 22px;   justify-content: flex-start; }

            .nav__item {
                justify-content: flex-start;
                padding: 9px 22px;
                border-right: 0;
                border-left: 3px solid transparent;
            }

            .nav__item--active { border-left-color: var(--color-accent); border-right-color: transparent; }

            .burger { display: flex; }

            .search, .profile__text, .topbar__divider { display: none; }

            .topbar { gap: 12px; padding: 0 16px; }

            .content { padding: 16px; }
        }
    `]
})
export class AppLayout {
    private readonly router      = inject(Router);
    private readonly destroyRef  = inject(DestroyRef);
    private readonly authService = inject(AuthService);
    private readonly langService = inject(LanguageService);
    private readonly transloco   = inject(TranslocoService);

    readonly sidebarOverlayOpen = signal(false);

    private readonly _pageTitle = signal('Tableau de bord');
    readonly pageTitle = this._pageTitle.asReadonly();

    readonly currentLang = this.langService.currentLang;
    readonly schoolYear  = '2025/2026'; // TODO(API): depuis EtablissementService

    readonly userInitials = computed(() => {
        const user = this.authService.currentUser();
        if (!user) return '??';
        const name = user.sub.split('@')[0];
        return name.substring(0, 2).toUpperCase();
    });

    readonly userSub  = computed(() => this.authService.currentUser()?.sub ?? '');
    readonly userRole = computed(() => this.authService.role() ?? '');

    readonly alertCount = PENDING_ALERT_COUNT;

    private readonly activeLang = toSignal(this.transloco.langChanges$, {
        initialValue: this.transloco.getActiveLang()
    });

    readonly navGroups = computed((): NavGroup[] => {
        this.activeLang();
        return this.buildNav(this.authService.role());
    });

    readonly searchIcon = ICONS['search'];
    readonly bellIcon   = ICONS['bell'];
    readonly menuIcon   = ICONS['menu'];
    readonly xIcon      = ICONS['x'];

    constructor() {
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            let route = this.router.routerState.snapshot.root;
            while (route.firstChild) route = route.firstChild;
            this._pageTitle.set(route.data['breadcrumb'] ?? 'Tableau de bord');
            this.sidebarOverlayOpen.set(false);
        });
    }

    toggleSidebar(): void { this.sidebarOverlayOpen.update(v => !v); }
    closeSidebar():  void { this.sidebarOverlayOpen.set(false); }
    setLang(lang: Lang): void { this.langService.setLang(lang); }

    private t(key: string): string {
        return this.transloco.translate(`app.${key}`);
    }

    private buildNav(role: Role | null): NavGroup[] {
        if (!role) return [];

        const home: NavGroup = {
            label: '',
            items: [{ label: this.t('menu.tableauDeBord'), icon: 'pi pi-home', routerLink: '/app/tableau-de-bord' }]
        };

        const groups: NavGroup[] = [home];

        // ─── Scolarité ───────────────────────────────────────────────────────
        const scol: NavItem[] = [];
        if (['SUPER_ADMIN', 'SECRETARIAT', 'ECONOMAT', 'ENSEIGNANT'].includes(role)) {
            scol.push({ label: this.t('menu.eleves.label'), icon: 'pi pi-users', routerLink: '/app/eleves' });
        }
        if (['SUPER_ADMIN', 'SECRETARIAT', 'ENSEIGNANT'].includes(role)) {
            scol.push({ label: this.t('menu.emploiDuTemps.label'),  icon: 'pi pi-calendar',  routerLink: '/app/emploi-du-temps/classe' });
            scol.push({ label: this.t('menu.resultats.label'),      icon: 'pi pi-chart-bar', routerLink: '/app/resultats/bulletins' });
            scol.push({ label: this.t('menu.discipline.label'),     icon: 'pi pi-ban',       routerLink: '/app/discipline/sanctions' });
        }
        if (['SUPER_ADMIN', 'ENSEIGNANT'].includes(role)) {
            scol.push({ label: this.t('menu.cahierDeTexte.label'), icon: 'pi pi-book', routerLink: '/app/cahier-texte/saisie' });
        } else if (role === 'SECRETARIAT') {
            scol.push({ label: this.t('menu.cahierDeTexte.label'), icon: 'pi pi-book', routerLink: '/app/cahier-texte/consultation' });
        }
        if (scol.length) groups.push({ label: 'Scolarité', items: scol });

        // ─── Finances ────────────────────────────────────────────────────────
        const fin: NavItem[] = [];
        if (['SUPER_ADMIN', 'ECONOMAT'].includes(role)) {
            fin.push({ label: this.t('menu.finances.label'), icon: 'pi pi-wallet',     routerLink: '/app/finances/versements' });
            fin.push({ label: this.t('menu.paie.label'),     icon: 'pi pi-money-bill', routerLink: '/app/paie/bulletins' });
        } else if (role === 'SECRETARIAT') {
            fin.push({ label: this.t('menu.finances.moratoires'), icon: 'pi pi-calendar-times', routerLink: '/app/finances/moratoires' });
        }
        if (fin.length) groups.push({ label: 'Finances', items: fin });

        // ─── Administration ──────────────────────────────────────────────────
        const adm: NavItem[] = [];
        if (['SUPER_ADMIN', 'SECRETARIAT'].includes(role)) {
            adm.push({ label: this.t('menu.personnel.label'), icon: 'pi pi-id-card', routerLink: '/app/personnel' });
        }
        if (role === 'SUPER_ADMIN') {
            adm.push({ label: this.t('menu.parametrage.label'),   icon: 'pi pi-cog',       routerLink: '/app/parametrage/classes' });
        }
        if (['SUPER_ADMIN', 'COMMUNICATION'].includes(role)) {
            adm.push({ label: this.t('menu.communication.label'), icon: 'pi pi-megaphone', routerLink: '/app/communication/actualites' });
        }
        if (adm.length) groups.push({ label: 'Administration', items: adm });

        return groups;
    }
}
