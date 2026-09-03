import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    HostListener,
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

// ── Modèle de navigation 3 niveaux ─────────────────────────────────────────
interface NavItem    { kind: 'item';    label: string; icon: string; routerLink: string; }
interface NavSection { kind: 'section'; label: string; icon: string; children: NavItem[]; firstRoute: string; }
type     NavEntry  = NavItem | NavSection;
interface NavGroup   { label: string;  entries: NavEntry[]; }

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterModule, IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <!-- ── Overlay backdrop (mobile) ────────────────────────────────────── -->
        @if (sidebarOverlayOpen()) {
            <div class="overlay-backdrop" (click)="closeSidebar()" aria-hidden="true"></div>
        }

        <div class="shell">
            <!-- ── Sidebar ─────────────────────────────────────────────────── -->
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
                            @for (entry of group.entries; track entry.kind === 'item' ? entry.routerLink : entry.label) {
                                @if (entry.kind === 'item') {
                                    <!-- Lien direct -->
                                    <a
                                        class="nav__item"
                                        [routerLink]="entry.routerLink"
                                        routerLinkActive="nav__item--active"
                                        [routerLinkActiveOptions]="{ exact: false }"
                                        [title]="entry.label"
                                        (click)="closeSidebar()"
                                    >
                                        <i [class]="entry.icon" aria-hidden="true"></i>
                                        <span>{{ entry.label }}</span>
                                    </a>
                                } @else {
                                    <!-- Section accordéon -->
                                    <div class="nav__section-wrap">
                                        <button
                                            type="button"
                                            class="nav__section-hd"
                                            [class.is-expanded]="isSectionExpanded(entry.label)"
                                            [class.is-active]="isSectionActive(entry)"
                                            (click)="handleSectionClick(entry)"
                                            [title]="entry.label"
                                        >
                                            <i [class]="entry.icon" class="nav__section-icon" aria-hidden="true"></i>
                                            <span class="nav__section-label">{{ entry.label }}</span>
                                            <span
                                                class="nav__section-arrow"
                                                [class.is-rotated]="isSectionExpanded(entry.label)"
                                                aria-hidden="true"
                                            >›</span>
                                        </button>

                                        @if (isSectionExpanded(entry.label)) {
                                            <div class="nav__children" role="list">
                                                @for (child of entry.children; track child.routerLink) {
                                                    <a
                                                        class="nav__child"
                                                        role="listitem"
                                                        [routerLink]="child.routerLink"
                                                        routerLinkActive="nav__child--active"
                                                        [routerLinkActiveOptions]="{ exact: false }"
                                                        [title]="child.label"
                                                        (click)="closeSidebar()"
                                                    >{{ child.label }}</a>
                                                }
                                            </div>
                                        }
                                    </div>
                                }
                            }
                        </div>
                    }
                </nav>

                <!-- Sélecteur FR / EN -->
                <div class="lang">
                    <div class="lang__pills" role="group" aria-label="Langue">
                        <button type="button" class="lang__pill"
                            [class.lang__pill--on]="currentLang() === 'fr'"
                            [attr.aria-pressed]="currentLang() === 'fr'"
                            (click)="setLang('fr')"
                        >FR</button>
                        <button type="button" class="lang__pill lang__pill--overlap"
                            [class.lang__pill--on]="currentLang() === 'en'"
                            [attr.aria-pressed]="currentLang() === 'en'"
                            (click)="setLang('en')"
                        >EN</button>
                    </div>
                    <span class="lang__year">{{ schoolYear }}</span>
                </div>
            </aside>

            <!-- ── Main : topbar + contenu ─────────────────────────────────── -->
            <div class="main">
                <header class="topbar">
                    <button type="button" class="burger" (click)="toggleSidebar()" aria-label="Ouvrir le menu">
                        <cob-icon [path]="sidebarOverlayOpen() ? xIcon : menuIcon" [size]="20" />
                    </button>

                    <div class="topbar__heading">
                        <h1 class="topbar__title">{{ pageTitle() }}</h1>
                    </div>

                    <label class="search" aria-label="Rechercher">
                        <cob-icon [path]="searchIcon" [size]="15" [strokeWidth]="2" class="search__icon" />
                        <input class="search__input" type="search"
                            placeholder="Rechercher un élève, une classe…"
                            aria-label="Rechercher" />
                    </label>

                    <div class="topbar__actions">
                        <button type="button" class="notif" [attr.aria-label]="'Notifications (' + alertCount + ')'">
                            <cob-icon [path]="bellIcon" [size]="19" />
                            @if (alertCount > 0) {
                                <span class="notif__badge" aria-hidden="true">{{ alertCount }}</span>
                            }
                        </button>

                        <span class="topbar__divider" aria-hidden="true"></span>

                        <div class="profile" [class.is-open]="profileMenuOpen()">
                            <button type="button" class="profile__trigger"
                                (click)="toggleProfileMenu($event)"
                                [attr.aria-expanded]="profileMenuOpen()"
                                aria-haspopup="true"
                            >
                                <span class="profile__avatar">{{ userInitials() }}</span>
                                <span class="profile__text">
                                    <span class="profile__name">{{ userSub() }}</span>
                                    <span class="profile__role">{{ userRole() }}</span>
                                </span>
                            </button>
                            @if (profileMenuOpen()) {
                                <div class="profile-menu" role="menu">
                                    <button type="button" class="profile-menu__item profile-menu__item--danger"
                                        role="menuitem" (click)="logout()">
                                        <cob-icon [path]="signOutIcon" [size]="14" />
                                        {{ logoutLabel() }}
                                    </button>
                                </div>
                            }
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
        :host { display: block; height: 100%; }

        /* ── Shell ──────────────────────────────────────────────────────────── */
        .shell {
            display: flex;
            height: 100%;
            min-height: 100vh;
            background: var(--color-canvas);
        }

        /* ── Backdrop ───────────────────────────────────────────────────────── */
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

        /* Lien direct */
        .nav__item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 9px 22px;
            font-size: 13.5px;
            font-weight: 500;
            color: var(--color-text-on-dark);
            border-left: 3px solid transparent;
            text-decoration: none;
            white-space: nowrap;
            transition: background 0.15s, color 0.15s;
        }

        .nav__item i { font-size: 15px; flex-shrink: 0; }

        .nav__item:hover { background: rgba(255,255,255,0.06); color: #fff; }

        .nav__item--active {
            background: rgba(232, 114, 44, 0.16);
            border-left-color: var(--color-accent);
            color: #fff;
        }

        .nav__item--active:hover { background: rgba(232, 114, 44, 0.22); }

        /* Section accordéon ── en-tête */
        .nav__section-hd {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 9px 22px;
            width: 100%;
            font-family: inherit;
            font-size: 13.5px;
            font-weight: 500;
            color: var(--color-text-on-dark);
            background: none;
            border: 0;
            border-left: 3px solid transparent;
            text-align: left;
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.15s, color 0.15s;
        }

        .nav__section-hd:hover { background: rgba(255,255,255,0.06); color: #fff; }

        .nav__section-hd.is-active {
            color: rgba(255,255,255,0.92);
            border-left-color: rgba(232, 114, 44, 0.5);
        }

        .nav__section-hd.is-expanded { color: #fff; }

        .nav__section-icon { font-size: 15px; flex-shrink: 0; }

        .nav__section-label { flex: 1; }

        .nav__section-arrow {
            font-size: 12px;
            opacity: 0.6;
            transition: transform 0.2s ease;
            display: inline-block;
        }

        .nav__section-arrow.is-rotated { transform: rotate(90deg); opacity: 1; }

        /* Section accordéon ── sous-items */
        .nav__children { padding-bottom: 4px; }

        .nav__child {
            display: block;
            padding: 7px 22px 7px 52px;
            font-size: 12.5px;
            font-weight: 400;
            color: var(--color-text-on-dark);
            text-decoration: none;
            border-left: 3px solid transparent;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: background 0.12s, color 0.12s;
        }

        .nav__child:hover { background: rgba(255,255,255,0.05); color: #fff; }

        .nav__child--active {
            background: rgba(232, 114, 44, 0.14);
            border-left-color: var(--color-accent);
            color: #fff;
            font-weight: 500;
        }

        /* ── Langue ─────────────────────────────────────────────────────────── */
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
            border: 1.5px solid rgba(255,255,255,0.6);
            border-radius: var(--radius-full);
            cursor: pointer;
            transition: background 0.12s;
        }

        .lang__pill--overlap { margin-left: -8px; }

        .lang__pill--on { background: var(--color-accent); border-color: var(--color-accent); color: #fff; z-index: 1; }

        .lang__year { font-size: 11px; color: var(--color-text-on-dark-muted); }

        /* ── Main ───────────────────────────────────────────────────────────── */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

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

        .topbar__actions { margin-left: auto; display: flex; align-items: center; gap: 16px; }

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

        .topbar__divider { width: 1px; height: 26px; background: var(--color-border); }

        /* ── Profil + dropdown ──────────────────────────────────────────────── */
        .profile { position: relative; }

        .profile__trigger {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 4px 6px;
            font-family: inherit;
            text-align: left;
            background: none;
            border: 0;
            cursor: pointer;
            border-radius: var(--radius-sm);
            transition: background 0.12s;
        }

        .profile__trigger:hover { background: var(--color-surface-sunken); }

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

        .profile__text { display: flex; flex-direction: column; line-height: 1.2; }
        .profile__name { font-size: 12.5px; font-weight: 600; color: var(--color-text); }
        .profile__role { font-size: 10.5px; color: var(--color-text-muted); }

        .profile-menu {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            min-width: 180px;
            background: var(--color-surface);
            border: 1px solid var(--color-border-strong);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-card);
            z-index: 200;
            overflow: hidden;
        }

        .profile-menu__item {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 10px 14px;
            width: 100%;
            font-family: inherit;
            font-size: 13px;
            text-align: left;
            background: none;
            border: 0;
            cursor: pointer;
            color: var(--color-text-body);
            transition: background 0.12s;
        }

        .profile-menu__item:hover { background: var(--color-surface-sunken); }
        .profile-menu__item--danger { color: var(--color-danger); }
        .profile-menu__item--danger:hover { background: var(--color-danger-soft); }

        /* ── Contenu ────────────────────────────────────────────────────────── */
        .content { flex: 1; min-height: 0; padding: 24px 26px; overflow-y: auto; }

        /* ── Tablette ≤ 1080 px : icônes seules ─────────────────────────────── */
        @media (max-width: 1080px) {
            .sidebar { width: 78px; }

            .brand__text, .nav__group-label, .nav__item span,
            .nav__section-label, .nav__section-arrow,
            .lang__year, .brand__tagline { display: none; }

            .brand, .lang { justify-content: center; padding-inline: 0; }

            /* Liens directs centrés, active à droite */
            .nav__item {
                justify-content: center;
                padding-inline: 0;
                border-left-width: 0;
                border-right: 3px solid transparent;
            }
            .nav__item--active { border-right-color: var(--color-accent); }

            /* Sections : icône centrée, active à droite, pas de children */
            .nav__section-hd {
                justify-content: center;
                padding-inline: 0;
                border-left-width: 0;
                border-right: 3px solid transparent;
            }
            .nav__section-hd.is-active { border-right-color: rgba(232, 114, 44, 0.7); }
            .nav__children { display: none; }
        }

        /* ── Mobile ≤ 767 px : overlay pleine largeur ───────────────────────── */
        @media (max-width: 767px) {
            .sidebar {
                position: fixed;
                top: 0; left: 0;
                height: 100%;
                z-index: 100;
                width: var(--shell-sidebar-width);
                transform: translateX(-100%);
                transition: transform 0.25s ease, box-shadow 0.25s ease;
            }

            .sidebar.is-open { transform: translateX(0); box-shadow: var(--shadow-shell); }

            /* Restaurer tous les textes masqués à 1080 px */
            .brand__text, .nav__group-label, .nav__item span,
            .nav__section-label, .nav__section-arrow,
            .lang__year, .brand__tagline { display: revert; }

            .brand  { padding: 0 22px 24px; justify-content: flex-start; }
            .lang   { padding: 16px 22px;   justify-content: flex-start; }

            .nav__item {
                justify-content: flex-start;
                padding: 9px 22px;
                border-right: 0;
                border-left: 3px solid transparent;
            }
            .nav__item--active { border-left-color: var(--color-accent); border-right-color: transparent; }

            .nav__section-hd {
                justify-content: flex-start;
                padding: 9px 22px;
                border-right: 0;
                border-left: 3px solid transparent;
            }
            .nav__section-hd.is-active { border-left-color: rgba(232, 114, 44, 0.5); }
            .nav__children { display: block; }

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
    private readonly elRef       = inject(ElementRef);

    readonly sidebarOverlayOpen = signal(false);
    readonly profileMenuOpen    = signal(false);
    readonly expandedSections   = signal<Set<string>>(new Set());

    private readonly _pageTitle  = signal('Tableau de bord');
    private readonly _currentUrl = signal('');

    readonly pageTitle  = this._pageTitle.asReadonly();
    readonly currentLang = this.langService.currentLang;
    readonly schoolYear  = '2025/2026'; // TODO(API): depuis EtablissementService

    readonly userInitials = computed(() => {
        const user = this.authService.currentUser();
        if (!user) return '??';
        return user.sub.split('@')[0].substring(0, 2).toUpperCase();
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

    readonly logoutLabel = computed(() => { this.activeLang(); return this.t('topbar.seDeconnecter'); });

    readonly searchIcon  = ICONS['search'];
    readonly bellIcon    = ICONS['bell'];
    readonly menuIcon    = ICONS['menu'];
    readonly xIcon       = ICONS['x'];
    readonly signOutIcon = ICONS['signOut'];

    constructor() {
        const initialUrl = this.router.routerState.snapshot.url;
        this._currentUrl.set(initialUrl);
        this.autoExpand(initialUrl);

        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            const url = this.router.routerState.snapshot.url;
            this._currentUrl.set(url);
            let route = this.router.routerState.snapshot.root;
            while (route.firstChild) route = route.firstChild;
            this._pageTitle.set(route.data['breadcrumb'] ?? 'Tableau de bord');
            this.sidebarOverlayOpen.set(false);
            this.autoExpand(url);
        });
    }

    @HostListener('document:click', ['$event'])
    onDocClick(e: MouseEvent): void {
        if (this.profileMenuOpen() && !this.elRef.nativeElement.contains(e.target)) {
            this.profileMenuOpen.set(false);
        }
    }

    // ── État de la sidebar ──────────────────────────────────────────────────
    toggleSidebar(): void { this.sidebarOverlayOpen.update(v => !v); }
    closeSidebar():  void { this.sidebarOverlayOpen.set(false); }
    setLang(lang: Lang): void { this.langService.setLang(lang); }

    // ── Profil ──────────────────────────────────────────────────────────────
    toggleProfileMenu(e: MouseEvent): void { e.stopPropagation(); this.profileMenuOpen.update(v => !v); }
    logout(): void { this.profileMenuOpen.set(false); this.authService.logout(); }

    // ── Sections accordéon ──────────────────────────────────────────────────
    protected isSectionExpanded(label: string): boolean {
        return this.expandedSections().has(label);
    }

    protected isSectionActive(entry: NavSection): boolean {
        const url = this._currentUrl();
        return entry.children.some(c => url.startsWith(c.routerLink));
    }

    protected handleSectionClick(entry: NavSection): void {
        const w = window.innerWidth;
        if (w > 767 && w <= 1080) {
            // Mode icônes : naviguer directement vers le premier enfant
            void this.router.navigate([entry.firstRoute]);
            this.closeSidebar();
        } else {
            this.toggleSection(entry.label);
        }
    }

    private toggleSection(label: string): void {
        this.expandedSections.update(s => {
            const next = new Set(s);
            if (next.has(label)) next.delete(label); else next.add(label);
            return next;
        });
    }

    private autoExpand(url: string): void {
        for (const group of this.navGroups()) {
            for (const entry of group.entries) {
                if (entry.kind === 'section' && entry.children.some(c => url.startsWith(c.routerLink))) {
                    this.expandedSections.update(s => { const n = new Set(s); n.add(entry.label); return n; });
                }
            }
        }
    }

    private t(key: string): string {
        return this.transloco.translate(`app.${key}`);
    }

    // ── Constructeurs de nœuds (helpers locaux) ─────────────────────────────
    private item(label: string, icon: string, routerLink: string): NavItem {
        return { kind: 'item', label, icon, routerLink };
    }

    private section(label: string, icon: string, children: NavItem[]): NavSection {
        return { kind: 'section', label, icon, children, firstRoute: children[0]?.routerLink ?? '' };
    }

    // ── Construction du menu complet selon PAGES_ET_NAVIGATION.md §1 ────────
    private buildNav(role: Role | null): NavGroup[] {
        if (!role) return [];

        const home: NavGroup = {
            label: '',
            entries: [this.item(this.t('menu.tableauDeBord'), 'pi pi-home', '/app/tableau-de-bord')]
        };

        // ── Scolarité ────────────────────────────────────────────────────────
        const scolEntries: NavEntry[] = [];

        // Élèves [SUPER_ADMIN, SECRETARIAT, ECONOMAT (lecture), ENSEIGNANT (lecture)]
        if (['SUPER_ADMIN', 'SECRETARIAT', 'ECONOMAT', 'ENSEIGNANT'].includes(role)) {
            const ch: NavItem[] = [this.item(this.t('menu.eleves.liste'), '', '/app/eleves')];
            if (['SUPER_ADMIN', 'SECRETARIAT'].includes(role)) {
                ch.push(this.item(this.t('menu.eleves.nouveau'), '', '/app/eleves/nouveau'));
            }
            ch.push(this.item(this.t('menu.eleves.fiche'), '', '/app/fiche-eleve'));
            scolEntries.push(this.section(this.t('menu.eleves.label'), 'pi pi-users', ch));
        }

        // Emploi du temps [SUPER_ADMIN, SECRETARIAT, ENSEIGNANT (lecture propre)]
        if (['SUPER_ADMIN', 'SECRETARIAT', 'ENSEIGNANT'].includes(role)) {
            const ch: NavItem[] = [
                this.item(this.t('menu.emploiDuTemps.parClasse'),     '', '/app/emploi-du-temps/classe'),
                this.item(this.t('menu.emploiDuTemps.parEnseignant'), '', '/app/emploi-du-temps/enseignant'),
            ];
            if (['SUPER_ADMIN', 'SECRETARIAT'].includes(role)) {
                ch.push(this.item(this.t('menu.emploiDuTemps.nouveauCreneau'), '', '/app/emploi-du-temps/nouveau'));
            }
            scolEntries.push(this.section(this.t('menu.emploiDuTemps.label'), 'pi pi-calendar', ch));
        }

        // Résultats [ENSEIGNANT, SUPER_ADMIN, SECRETARIAT (lecture)]
        if (['SUPER_ADMIN', 'SECRETARIAT', 'ENSEIGNANT'].includes(role)) {
            const ch: NavItem[] = [];
            if (['SUPER_ADMIN', 'ENSEIGNANT'].includes(role)) {
                ch.push(this.item(this.t('menu.resultats.saisie'), '', '/app/resultats/saisie'));
            }
            if (role === 'SUPER_ADMIN') {
                ch.push(this.item(this.t('menu.resultats.validation'), '', '/app/resultats/validation'));
            }
            ch.push(this.item(this.t('menu.resultats.bulletins'), '', '/app/resultats/bulletins'));
            scolEntries.push(this.section(this.t('menu.resultats.label'), 'pi pi-chart-bar', ch));
        }

        // Discipline [ENSEIGNANT, SECRETARIAT, SUPER_ADMIN]
        if (['SUPER_ADMIN', 'SECRETARIAT', 'ENSEIGNANT'].includes(role)) {
            const ch: NavItem[] = [this.item(this.t('menu.discipline.sanctions'), '', '/app/discipline/sanctions')];
            if (['SUPER_ADMIN', 'SECRETARIAT'].includes(role)) {
                ch.push(this.item(this.t('menu.discipline.bonsSortie'), '', '/app/discipline/bons-sortie'));
            }
            if (role === 'SUPER_ADMIN') {
                ch.push(this.item(this.t('menu.discipline.regles'), '', '/app/discipline/regles'));
            }
            scolEntries.push(this.section(this.t('menu.discipline.label'), 'pi pi-ban', ch));
        }

        // Cahier de texte [ENSEIGNANT, SUPER_ADMIN, SECRETARIAT (consultation)]
        if (['SUPER_ADMIN', 'ENSEIGNANT', 'SECRETARIAT'].includes(role)) {
            const ch: NavItem[] = [];
            if (['SUPER_ADMIN', 'ENSEIGNANT'].includes(role)) {
                ch.push(this.item(this.t('menu.cahierDeTexte.maProgression'), '', '/app/cahier-texte/saisie'));
            }
            ch.push(this.item(this.t('menu.cahierDeTexte.consultation'), '', '/app/cahier-texte/consultation'));
            if (role === 'SUPER_ADMIN') {
                ch.push(this.item(this.t('menu.cahierDeTexte.validation'), '', '/app/cahier-texte/validation'));
            }
            scolEntries.push(this.section(this.t('menu.cahierDeTexte.label'), 'pi pi-book', ch));
        }

        // ── Finances ─────────────────────────────────────────────────────────
        const finEntries: NavEntry[] = [];

        // Finances [ECONOMAT, SUPER_ADMIN, SECRETARIAT (lecture limitée)]
        if (['SUPER_ADMIN', 'SECRETARIAT', 'ECONOMAT'].includes(role)) {
            const ch: NavItem[] = [];
            if (['SUPER_ADMIN', 'ECONOMAT'].includes(role)) {
                ch.push(this.item(this.t('menu.finances.versements'),         '', '/app/finances/versements'));
                ch.push(this.item(this.t('menu.finances.validationsBancaires'), '', '/app/finances/validations'));
            }
            ch.push(this.item(this.t('menu.finances.moratoires'), '', '/app/finances/moratoires'));
            if (['SUPER_ADMIN', 'ECONOMAT'].includes(role)) {
                ch.push(this.item(this.t('menu.finances.alertes'), '', '/app/finances/alertes'));
            }
            ch.push(this.item(this.t('menu.finances.etats'), '', '/app/finances/etats'));
            finEntries.push(this.section(this.t('menu.finances.label'), 'pi pi-wallet', ch));
        }

        // Paie [ECONOMAT, SUPER_ADMIN — jamais SECRETARIAT]
        if (['SUPER_ADMIN', 'ECONOMAT'].includes(role)) {
            const ch: NavItem[] = [];
            if (role === 'SUPER_ADMIN') {
                ch.push(this.item(this.t('menu.paie.baremes'), '', '/app/paie/baremes'));
            }
            ch.push(this.item(this.t('menu.paie.bulletins'), '', '/app/paie/bulletins'));
            finEntries.push(this.section(this.t('menu.paie.label'), 'pi pi-money-bill', ch));
        }

        // ── Administration ────────────────────────────────────────────────────
        const admEntries: NavEntry[] = [];

        // Personnel [SUPER_ADMIN, SECRETARIAT, ECONOMAT (lecture)]
        if (['SUPER_ADMIN', 'SECRETARIAT', 'ECONOMAT'].includes(role)) {
            const ch: NavItem[] = [this.item(this.t('menu.personnel.liste'), '', '/app/personnel')];
            if (['SUPER_ADMIN', 'SECRETARIAT'].includes(role)) {
                ch.push(this.item(this.t('menu.personnel.nouveau'), '', '/app/personnel/nouveau'));
            }
            admEntries.push(this.section(this.t('menu.personnel.label'), 'pi pi-id-card', ch));
        }

        // Paramétrage [SUPER_ADMIN principalement]
        if (role === 'SUPER_ADMIN') {
            admEntries.push(this.section(this.t('menu.parametrage.label'), 'pi pi-cog', [
                this.item(this.t('menu.parametrage.classes'),           '', '/app/parametrage/classes'),
                this.item(this.t('menu.parametrage.trimestres'),        '', '/app/parametrage/trimestres'),
                this.item(this.t('menu.parametrage.tauxScolarite'),     '', '/app/parametrage/taux-scolarite'),
                this.item(this.t('menu.parametrage.quotasHoraires'),    '', '/app/parametrage/quotas-horaires'),
                this.item(this.t('menu.parametrage.matieres'),          '', '/app/parametrage/matieres'),
                this.item(this.t('menu.parametrage.coefficients'),      '', '/app/parametrage/coefficients'),
                this.item(this.t('menu.parametrage.niveaux'),           '', '/app/parametrage/niveaux'),
                this.item(this.t('menu.parametrage.modelesEngagement'), '', '/app/parametrage/modeles-engagement'),
            ]));
        }

        // Communication [SUPER_ADMIN, COMMUNICATION]
        if (['SUPER_ADMIN', 'COMMUNICATION'].includes(role)) {
            admEntries.push(this.section(this.t('menu.communication.label'), 'pi pi-megaphone', [
                this.item(this.t('menu.communication.actualites'), '', '/app/communication/actualites'),
                this.item(this.t('menu.communication.calendrier'), '', '/app/communication/calendrier'),
                this.item(this.t('menu.communication.contenu'),    '', '/app/communication/contenu'),
                this.item(this.t('menu.communication.equipe'),     '', '/app/communication/equipe'),
            ]));
        }

        const groups: NavGroup[] = [home];
        if (scolEntries.length) groups.push({ label: 'Scolarité',      entries: scolEntries });
        if (finEntries.length)  groups.push({ label: 'Finances',       entries: finEntries  });
        if (admEntries.length)  groups.push({ label: 'Administration', entries: admEntries  });
        return groups;
    }
}
