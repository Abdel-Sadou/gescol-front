import { Routes } from '@angular/router';
import { AppLayout } from '@/app/layout/components/app.layout';
import { LandingLayout } from '@/app/layout/components/app.landinglayout';
import { VitrineLayout } from '@/app/layout/components/app.vitrinelayout';
import { ParentLayout } from '@/app/layout/components/app.parentlayout';
import { Notfound } from '@/app/pages/notfound/notfound';
import { authGuard } from '@/app/core/guards/auth.guard';
import { roleGuard } from '@/app/core/guards/role.guard';

const INTERNAL_ROLES = ['SUPER_ADMIN', 'SECRETARIAT', 'ECONOMAT', 'ENSEIGNANT', 'COMMUNICATION'] as const;

export const appRoutes: Routes = [

    // --- Racine → vitrine ---
    { path: '', redirectTo: '/vitrine', pathMatch: 'full' },

    // --- Public : page de connexion / inscription parent ---
    {
        path: 'connexion',
        loadComponent: () => import('@/app/pages/connexion/connexion').then(c => c.Connexion)
    },

    // --- Public : vitrine de l'établissement ---
    {
        path: 'vitrine',
        component: VitrineLayout,
        children: [
            {
                path: '',
                loadComponent: () => import('@/app/pages/vitrine/vitrine').then(c => c.Vitrine)
            },
            {
                path: 'actualites/:id',
                loadComponent: () => import('@/app/pages/vitrine/article/article').then(c => c.Article)
            }
        ]
    },

    // --- Protégé : espace parent (rôle PARENT uniquement) ---
    {
        path: 'parent',
        component: ParentLayout,
        canActivate: [authGuard, roleGuard(['PARENT'])],
        children: [
            {
                path: '',
                loadComponent: () => import('@/app/pages/parent/dashboard/parent-dashboard').then(c => c.ParentDashboard)
            },
            {
                path: 'quittance',
                loadComponent: () => import('@/app/pages/parent/quittance/quittance').then(c => c.Quittance),
                data: { breadcrumb: 'Quittance' }
            },
            {
                path: 'quittance/:versementId',
                loadComponent: () => import('@/app/pages/parent/quittance/quittance').then(c => c.Quittance),
                data: { breadcrumb: 'Quittance' }
            },
            {
                path: 'inscription/nouvelle',
                loadComponent: () => import('@/app/pages/parent/inscription/nouvelle-inscription').then(c => c.NouvelleInscription),
                data: { breadcrumb: 'Nouvelle inscription' }
            },
            {
                path: 'inscription/mes-inscriptions',
                loadComponent: () => import('@/app/pages/parent/inscription/mes-inscriptions').then(c => c.MesInscriptions),
                data: { breadcrumb: 'Mes inscriptions' }
            }
        ]
    },

    // --- Protégé : application interne (tous rôles sauf PARENT) ---
    {
        path: 'app',
        component: AppLayout,
        canActivate: [authGuard, roleGuard([...INTERNAL_ROLES])],
        children: [
            { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' },
            {
                path: 'tableau-de-bord',
                loadComponent: () => import('@/app/pages/dashboards/marketing/marketingdashboard').then(c => c.MarketingDashboard),
                data: { breadcrumb: 'Tableau de bord' }
            },

            // Modules métier GESCOL — placeholders, écrans réels à venir
            { path: 'fiche-eleve', loadComponent: () => import('@/app/pages/app/fiche-eleve/fiche-eleve').then(c => c.FicheEleve), data: { breadcrumb: 'Fiche élève' } },
            { path: 'eleves',           loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Élèves' } },
            { path: 'inscriptions',     loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Inscriptions' } },
            { path: 'finances',         loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Finances' } },
            { path: 'paie',             loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Paie' } },
            { path: 'personnel',        loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Personnel' } },
            { path: 'parametrage',      loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Paramétrage' } },
            { path: 'emploi-du-temps',  loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Emploi du temps' } },
            { path: 'resultats',        loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Résultats' } },
            { path: 'discipline',       loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Discipline' } },
            { path: 'cahier-de-texte',  loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Cahier de texte' } },
            { path: 'communication',    loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Communication' } },

            // Pages de démo Poseidon conservées (sans lien dans le menu GESCOL)
            { path: 'uikit',       data: { breadcrumb: 'UI Kit' }, loadChildren: () => import('@/app/pages/uikit/uikit.routes') },
            { path: 'pages',       data: { breadcrumb: 'Pages' },  loadChildren: () => import('@/app/pages/pages.routes') },
            { path: 'apps',        data: { breadcrumb: 'Apps' },   loadChildren: () => import('@/app/apps/apps.routes') },
            { path: 'blocks',      data: { breadcrumb: 'Blocks' }, loadChildren: () => import('@/app/pages/blocks/blocks.routes') },
            { path: 'ecommerce',   data: { breadcrumb: 'E-Commerce' }, loadChildren: () => import('@/app/pages/ecommerce/ecommerce.routes') },
            { path: 'profile',     data: { breadcrumb: 'Profil' }, loadChildren: () => import('@/app/pages/usermanagement/usermanagement.routes') },
            { path: 'documentation', data: { breadcrumb: 'Documentation' }, loadComponent: () => import('@/app/pages/documentation/documentation').then(c => c.Documentation) }
        ]
    },

    // --- Pages Poseidon conservées pour rétrocompatibilité (landing glassmorphism) ---
    {
        path: 'landing',
        component: LandingLayout,
        children: [
            { path: '',             loadComponent: () => import('@/app/pages/landing').then(c => c.Landing) },
            { path: 'about',        loadComponent: () => import('@/app/pages/landing/about').then(c => c.About) },
            { path: 'pricing',      loadComponent: () => import('@/app/pages/landing/pricing').then(c => c.Pricing) },
            { path: 'contact',      loadComponent: () => import('@/app/pages/landing/contact').then(c => c.Contact) },
            { path: 'login',        loadComponent: () => import('@/app/pages/auth/login').then(c => c.Login) },
            { path: 'register',     loadComponent: () => import('@/app/pages/auth/register').then(c => c.Register) },
            { path: 'verification', loadComponent: () => import('@/app/pages/auth/verification').then(c => c.Verification) },
            { path: 'forgot-password', loadComponent: () => import('@/app/pages/auth/forgotpassword').then(c => c.ForgotPassword) },
            { path: 'new-password', loadComponent: () => import('@/app/pages/auth/newpassword').then(c => c.NewPassword) },
            { path: 'lock-screen',  loadComponent: () => import('@/app/pages/auth/lockscreen').then(c => c.LockScreen) },
            { path: 'oops',         loadComponent: () => import('@/app/pages/oops/oops').then(c => c.Oops) },
            { path: 'access',       loadComponent: () => import('@/app/pages/auth/access').then(c => c.Access) },
            { path: 'error',        redirectTo: '/notfound' }
        ]
    },

    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
