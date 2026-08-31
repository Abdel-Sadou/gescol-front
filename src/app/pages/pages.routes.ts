import { Routes } from '@angular/router';

export default [
    {
        path: 'documentation',
        loadComponent: () => import('@/app/pages/documentation/documentation').then((c) => c.Documentation)
    },
    { path: 'crud', loadComponent: () => import('@/app/pages/crud/crud').then((c) => c.Crud), data: { breadcrumb: 'Crud' } },
    { path: 'empty', loadComponent: () => import('@/app/pages/empty/empty').then((c) => c.Empty), data: { breadcrumb: 'Empty' } },
    {
        path: 'invoice',
        loadComponent: () => import('@/app/pages/invoice/invoice').then((c) => c.Invoice),
        data: { breadcrumb: 'Invoice' }
    },
    {
        path: 'aboutus',
        loadComponent: () => import('@/app/pages/aboutus/aboutus').then((c) => c.AboutUs),
        data: { breadcrumb: 'About' }
    },
    { path: 'help', loadComponent: () => import('@/app/pages/help/help').then((c) => c.Help), data: { breadcrumb: 'Help' } },
    { path: 'faq', loadComponent: () => import('@/app/pages/faq/faq').then((c) => c.Faq), data: { breadcrumb: 'FAQ' } },
    {
        path: 'contact',
        loadComponent: () => import('@/app/pages/contactus/contactus').then((c) => c.ContactUs),
        data: { breadcrumb: 'Contact Us' }
    },
    {
        path: 'error',
        redirectTo: '/notfound'
    },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
