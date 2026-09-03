import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard-home/dashboard-home.component').then(
        (m) => m.DashboardHomeComponent,
      ),
    title: 'Tableau de bord — COBIMAG',
  },
  { path: '**', redirectTo: '' },
];
