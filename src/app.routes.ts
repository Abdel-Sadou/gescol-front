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
                loadComponent: () => import('@/app/pages/app/dashboard/dashboard-home').then(c => c.DashboardHome),
                data: { breadcrumb: 'Tableau de bord' }
            },

            // Modules métier GESCOL — placeholders, écrans réels à venir
            { path: 'fiche-eleve', loadComponent: () => import('@/app/pages/app/fiche-eleve/fiche-eleve').then(c => c.FicheEleve), data: { breadcrumb: 'Fiche élève' } },

            // --- Élèves (F08) ---
            { path: 'eleves',                loadComponent: () => import('@/app/pages/app/eleves/eleve-liste').then(c => c.EleveListe), data: { breadcrumb: 'Élèves' } },
            { path: 'eleves/nouveau',        loadComponent: () => import('@/app/pages/app/eleves/eleve-form').then(c => c.EleveForm), data: { breadcrumb: 'Nouvel élève' } },
            { path: 'eleves/:id/editer',     loadComponent: () => import('@/app/pages/app/eleves/eleve-form').then(c => c.EleveForm), data: { breadcrumb: 'Modifier élève' } },

            // --- Modules métier — placeholders (F09-F16) ---
            // Paramétrage
            { path: 'parametrage/classes',            loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Classes' } },
            { path: 'parametrage/trimestres',         loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Trimestres & séquences' } },
            { path: 'parametrage/taux-scolarite',     loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Taux de scolarité' } },
            { path: 'parametrage/quotas-horaires',    loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Quotas horaires' } },
            { path: 'parametrage/matieres',           loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Matières' } },
            { path: 'parametrage/coefficients',       loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Coefficients' } },
            { path: 'parametrage/niveaux',            loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Niveaux' } },
            { path: 'parametrage/modeles-engagement', loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Modèles engagement' } },
            // Personnel
            { path: 'personnel',              loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Personnel' } },
            { path: 'personnel/nouveau',      loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Nouveau personnel' } },
            { path: 'personnel/:id/editer',   loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Modifier personnel' } },
            // Emploi du temps
            { path: 'emploi-du-temps/classe',     loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'EDT par classe' } },
            { path: 'emploi-du-temps/enseignant', loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'EDT par enseignant' } },
            { path: 'emploi-du-temps/nouveau',    loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Nouveau créneau' } },
            // Résultats
            { path: 'resultats/saisie',     loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Saisie des notes' } },
            { path: 'resultats/validation', loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Validation des notes' } },
            { path: 'resultats/bulletins',  loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Bulletins' } },
            // Discipline
            { path: 'discipline/sanctions', loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Sanctions' } },
            { path: 'discipline/bons-sortie', loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Bons de sortie' } },
            { path: 'discipline/regles',    loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Règles escalade' } },
            // Finances
            { path: 'finances/versements',  loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Versements' } },
            { path: 'finances/validations', loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Validations bancaires' } },
            { path: 'finances/moratoires',  loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Moratoires' } },
            { path: 'finances/alertes',     loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Alertes' } },
            { path: 'finances/etats',       loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'États & rapports' } },
            // Paie
            { path: 'paie/baremes',   loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Barèmes' } },
            { path: 'paie/bulletins', loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Bulletins de paie' } },
            // Cahier de texte
            { path: 'cahier-texte/saisie',       loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Ma progression' } },
            { path: 'cahier-texte/consultation',  loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Consultation cahier' } },
            { path: 'cahier-texte/validation',    loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Validation cahier' } },
            // Communication
            { path: 'communication/actualites', loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Actualités' } },
            { path: 'communication/calendrier', loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Calendrier scolaire' } },
            { path: 'communication/contenu',    loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Contenu du site' } },
            { path: 'communication/equipe',     loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Équipe pédagogique' } },

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
