import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { ParentSpaceComponent } from './pages/parent-space/parent-space.component';
import { ReceiptComponent } from './pages/receipt/receipt.component';
import { StudentRecordComponent } from './pages/student-record/student-record.component';
import { ArticleComponent } from './pages/article/article.component';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'connexion', component: LoginComponent },
    { path: 'actualites/:id', component: ArticleComponent },
    { path: 'espace-parent', component: ParentSpaceComponent },
    { path: 'quittance', component: ReceiptComponent },
    { path: 'secretariat', component: StudentRecordComponent },
    { path: '**', redirectTo: '' }
];
