import { Routes } from '@angular/router';
import {MainLayoutComponent} from "./core/layouts/main-layout/main-layout.component";
import {AdminLayoutComponent} from "./core/layouts/admin-layout/admin-layout.component";

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
    ]
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
    ]
  },
];
