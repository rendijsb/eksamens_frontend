import { Routes } from '@angular/router';
import {MainLayoutComponent} from "./core/layouts/main-layout/main-layout.component";
import {AdminLayoutComponent} from "./core/layouts/admin-layout/admin-layout.component";
import {authGuard} from "./components/auth/guards/auth.guard";
import {RoleEnum} from "./components/auth/models/user.models";
import {UsersComponent} from "./components/admin/users-page/users/users.component";
import {UserFormComponent} from "./components/admin/users-page/user-form/user-form.component";
import {DashboardComponent} from "./components/admin/dashboard-page/dashboard/dashboard.component";
import {CategoriesAdminComponent} from "./components/admin/categories-page/categories-admin/categories-admin.component";
import {
  CategoriesAdminFormComponent
} from "./components/admin/categories-page/categories-admin-form/categories-admin-form.component";
import {ProductsAdminComponent} from "./components/admin/products-page/products-admin/products-admin.component";
import {
  ProductsAdminFormComponent
} from "./components/admin/products-page/products-admin-form/products-admin-form.component";
import {BannersAdminComponent} from "./components/admin/banners-page/banners-admin/banners-admin.component";
import {BannerFormComponent} from "./components/admin/banners-page/banner-form/banner-form.component";

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./components/main/home/home.component')
          .then(m => m.HomeComponent)
      },
      {
        path: 'products',
        component: MainLayoutComponent,
        children: [
          {
            path: '',
            loadComponent: () => import('./components/main/products/products.component')
              .then(m => m.ProductsComponent)
          }
        ]
      },
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
    path: 'admin/users',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: [RoleEnum.ADMIN] },
    children: [
      { path: '', component: UsersComponent },
      { path: 'create', component: UserFormComponent },
      { path: ':userId/edit', component: UserFormComponent }
    ]
  },
  {
    path: 'admin/dashboard',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR] },
    children: [
      { path: '', component: DashboardComponent },
    ]
  },
  {
    path: 'admin/categories',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR] },
    children: [
      { path: '', component: CategoriesAdminComponent },
      { path: 'create', component: CategoriesAdminFormComponent },
      { path: ':categoryId/edit', component: CategoriesAdminFormComponent }
    ]
  },
  {
    path: 'admin/products',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR] },
    children: [
      { path: '', component: ProductsAdminComponent },
      { path: 'create', component: ProductsAdminFormComponent },
      { path: ':productId/edit', component: ProductsAdminFormComponent }
    ]
  },
  {
    path: 'admin/banners',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR] },
    children: [
      { path: '', component: BannersAdminComponent },
      { path: 'create', component: BannerFormComponent },
      { path: ':bannerId/edit', component: BannerFormComponent }
    ]
  },
];
