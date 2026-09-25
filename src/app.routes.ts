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
            // Paramétrage (F09)
            { path: 'parametrage/classes',         loadComponent: () => import('@/app/pages/app/parametrage/classes/classes-liste').then(c => c.ClassesListe),                        data: { breadcrumb: 'Classes' } },
            { path: 'parametrage/trimestres',      loadComponent: () => import('@/app/pages/app/parametrage/trimestres/trimestres-liste').then(c => c.TrimestresListe),              data: { breadcrumb: 'Trimestres & séquences' } },
            { path: 'parametrage/taux-scolarite',  loadComponent: () => import('@/app/pages/app/parametrage/taux-scolarite/taux-scolarite-liste').then(c => c.TauxScolariteListe),  data: { breadcrumb: 'Taux de scolarité' } },
            { path: 'parametrage/quotas-horaires', loadComponent: () => import('@/app/pages/app/parametrage/quotas-horaires/quotas-horaires-liste').then(c => c.QuotasHorairesListe), data: { breadcrumb: 'Quotas horaires' } },
            { path: 'parametrage/matieres',        loadComponent: () => import('@/app/pages/app/parametrage/matieres/matieres-liste').then(c => c.MatieresListe),                    data: { breadcrumb: 'Matières' } },
            { path: 'parametrage/coefficients',    loadComponent: () => import('@/app/pages/app/parametrage/coefficients/coefficients-liste').then(c => c.CoefficientsListe),        data: { breadcrumb: 'Coefficients' } },
            { path: 'parametrage/niveaux',         loadComponent: () => import('@/app/pages/app/parametrage/niveaux/niveaux-liste').then(c => c.NiveauxListe),                        data: { breadcrumb: 'Niveaux' } },
            { path: 'parametrage/modeles-engagement',         loadComponent: () => import('@/app/pages/app/parametrage/modeles-engagement/modeles-engagement-liste').then(c => c.ModelesEngagementListe), data: { breadcrumb: 'Modèles engagement' } },
            { path: 'parametrage/modeles-engagement/nouveau', loadComponent: () => import('@/app/pages/app/parametrage/modeles-engagement/modele-engagement-form').then(c => c.ModeleEngagementForm),    data: { breadcrumb: 'Nouveau modèle' } },
            { path: 'parametrage/modeles-engagement/:id/editer', loadComponent: () => import('@/app/pages/app/parametrage/modeles-engagement/modele-engagement-form').then(c => c.ModeleEngagementForm), data: { breadcrumb: 'Modifier modèle' } },
            // Personnel (F10)
            { path: 'personnel',            loadComponent: () => import('@/app/pages/app/personnel/personnel-liste').then(c => c.PersonnelListe), data: { breadcrumb: 'Personnel' } },
            { path: 'personnel/nouveau',    loadComponent: () => import('@/app/pages/app/personnel/personnel-form').then(c => c.PersonnelForm),   data: { breadcrumb: 'Nouveau personnel' } },
            { path: 'personnel/:id/editer', loadComponent: () => import('@/app/pages/app/personnel/personnel-form').then(c => c.PersonnelForm),   data: { breadcrumb: 'Modifier personnel' } },
            // Emploi du temps (F10)
            { path: 'emploi-du-temps/classe',     loadComponent: () => import('@/app/pages/app/emploi-du-temps/emploi-du-temps-classe').then(c => c.EmploiDuTempsClasse),       data: { breadcrumb: 'EDT par classe' } },
            { path: 'emploi-du-temps/enseignant', loadComponent: () => import('@/app/pages/app/emploi-du-temps/emploi-du-temps-enseignant').then(c => c.EmploiDuTempsEnseignant), data: { breadcrumb: 'EDT par enseignant' } },
            { path: 'emploi-du-temps/nouveau',    loadComponent: () => import('@/app/pages/app/emploi-du-temps/creneau-form').then(c => c.CreneauForm),                          data: { breadcrumb: 'Nouveau créneau' } },
            // Résultats (F11)
            { path: 'resultats/saisie',     loadComponent: () => import('@/app/pages/app/resultats/saisie-notes').then(c => c.SaisieNotes),         data: { breadcrumb: 'Saisie des notes' } },
            { path: 'resultats/validation', loadComponent: () => import('@/app/pages/app/resultats/validation-notes').then(c => c.ValidationNotes), data: { breadcrumb: 'Validation des notes' } },
            { path: 'resultats/bulletins',  loadComponent: () => import('@/app/pages/app/resultats/bulletins').then(c => c.Bulletins),               data: { breadcrumb: 'Bulletins' } },
            // Discipline
            { path: 'discipline/sanctions',  loadComponent: () => import('@/app/pages/app/discipline/sanctions').then(c => c.Sanctions),           data: { breadcrumb: 'Sanctions' } },
            { path: 'discipline/bons-sortie',loadComponent: () => import('@/app/pages/app/discipline/bons-sortie').then(c => c.BonsSortie),         data: { breadcrumb: 'Bons de sortie' } },
            { path: 'discipline/regles',     loadComponent: () => import('@/app/pages/app/discipline/regles-escalade').then(c => c.ReglesEscalade), data: { breadcrumb: 'Règles escalade' } },
            // Finances (F13)
            { path: 'finances/versements',  loadComponent: () => import('@/app/pages/app/finances/versements').then(c => c.Versements),                    data: { breadcrumb: 'Versements' } },
            { path: 'finances/validations', loadComponent: () => import('@/app/pages/app/finances/validations-bancaires').then(c => c.ValidationsBancaires), data: { breadcrumb: 'Validations bancaires' } },
            { path: 'finances/moratoires',  loadComponent: () => import('@/app/pages/app/finances/moratoires').then(c => c.Moratoires),                    data: { breadcrumb: 'Moratoires' } },
            { path: 'finances/alertes',     loadComponent: () => import('@/app/pages/app/finances/alertes').then(c => c.Alertes),                          data: { breadcrumb: 'Alertes' } },
            { path: 'finances/etats',       loadComponent: () => import('@/app/pages/app/finances/etats').then(c => c.Etats),                              data: { breadcrumb: 'États & rapports' } },
            // Paie (F14) — SUPER_ADMIN + ECONOMAT uniquement (jamais SECRETARIAT)
            { path: 'paie/baremes',   canActivate: [roleGuard(['SUPER_ADMIN', 'ECONOMAT'])], loadComponent: () => import('@/app/pages/app/paie/baremes').then(c => c.Baremes),         data: { breadcrumb: 'Barèmes' } },
            { path: 'paie/bulletins', canActivate: [roleGuard(['SUPER_ADMIN', 'ECONOMAT'])], loadComponent: () => import('@/app/pages/app/paie/bulletins').then(c => c.BulletinsPaie), data: { breadcrumb: 'Bulletins de paie' } },
            // Cahier de texte
            { path: 'cahier-texte/saisie',       loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Ma progression' } },
            { path: 'cahier-texte/consultation',  loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Consultation cahier' } },
            { path: 'cahier-texte/validation',    loadComponent: () => import('@/app/pages/placeholder/placeholder').then(c => c.Placeholder), data: { breadcrumb: 'Validation cahier' } },
            // Administration (F17) — SUPER_ADMIN uniquement
            { path: 'administration/comptes', canActivate: [roleGuard(['SUPER_ADMIN'])], loadComponent: () => import('@/app/pages/app/administration/comptes/comptes-liste').then(c => c.ComptesListe), data: { breadcrumb: 'Comptes utilisateurs' } },

            // Communication (F16) — SUPER_ADMIN + COMMUNICATION
            { path: 'communication/actualites',           canActivate: [roleGuard(['SUPER_ADMIN', 'COMMUNICATION'])], loadComponent: () => import('@/app/pages/app/communication/actualites-liste').then(c => c.ActualitesListe), data: { breadcrumb: 'Actualités' } },
            { path: 'communication/actualites/nouvelle',  canActivate: [roleGuard(['SUPER_ADMIN', 'COMMUNICATION'])], loadComponent: () => import('@/app/pages/app/communication/actualite-form').then(c => c.ActualiteForm),       data: { breadcrumb: 'Nouvelle actualité' } },
            { path: 'communication/actualites/:id/editer',canActivate: [roleGuard(['SUPER_ADMIN', 'COMMUNICATION'])], loadComponent: () => import('@/app/pages/app/communication/actualite-form').then(c => c.ActualiteForm),       data: { breadcrumb: 'Modifier actualité' } },
            { path: 'communication/calendrier',           canActivate: [roleGuard(['SUPER_ADMIN', 'COMMUNICATION'])], loadComponent: () => import('@/app/pages/app/communication/calendrier').then(c => c.Calendrier),              data: { breadcrumb: 'Calendrier scolaire' } },
            { path: 'communication/contenu',              canActivate: [roleGuard(['SUPER_ADMIN', 'COMMUNICATION'])], loadComponent: () => import('@/app/pages/app/communication/contenu-vitrine').then(c => c.ContenuVitrine),     data: { breadcrumb: 'Contenu du site' } },
            { path: 'communication/equipe',               canActivate: [roleGuard(['SUPER_ADMIN', 'COMMUNICATION'])], loadComponent: () => import('@/app/pages/app/communication/equipe-pedagogique').then(c => c.EquipePedagogique), data: { breadcrumb: 'Équipe pédagogique' } },

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

    { path: '403', loadComponent: () => import('@/app/pages/erreur/acces-refuse').then(c => c.AccesRefuse) },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
