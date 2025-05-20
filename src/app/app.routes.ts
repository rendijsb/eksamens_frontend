import { Routes } from '@angular/router';
import { MainLayoutComponent } from "./core/layouts/main-layout/main-layout.component";
import { AdminLayoutComponent } from "./core/layouts/admin-layout/admin-layout.component";
import { authGuard } from "./components/auth/guards/auth.guard";
import { noAuthGuard } from "./components/auth/guards/no-auth.guard";
import { RoleEnum } from "./components/auth/models/user.models";
import { UsersComponent } from "./components/admin/users-page/users/users.component";
import { UserFormComponent } from "./components/admin/users-page/user-form/user-form.component";
import { DashboardComponent } from "./components/admin/dashboard-page/dashboard/dashboard.component";
import { CategoriesAdminComponent } from "./components/admin/categories-page/categories-admin/categories-admin.component";
import { CategoriesAdminFormComponent } from "./components/admin/categories-page/categories-admin-form/categories-admin-form.component";
import { ProductsAdminComponent } from "./components/admin/products-page/products-admin/products-admin.component";
import { ProductsAdminFormComponent } from "./components/admin/products-page/products-admin-form/products-admin-form.component";
import { BannersAdminComponent } from "./components/admin/banners-page/banners-admin/banners-admin.component";
import { BannerFormComponent } from "./components/admin/banners-page/banner-form/banner-form.component";
import { ProfileLayoutComponent } from "./core/layouts/profile-layout/profile-layout.component";
import { ProfileEditComponent } from "./components/profile/profile-edit/profile-edit.component";
import { ProfileImageComponent } from "./components/profile/profile-image/profile-image.component";
import { ChangePasswordComponent } from "./components/profile/change-password/change-password.component";
import { AddressListComponent } from "./components/profile/address-list/address-list.component";
import { AddressFormComponent } from "./components/profile/address-form/address-form.component";
import { OrderListComponent } from "./components/profile/order-list/order-list.component";
import { OrderDetailComponent } from "./components/profile/order-detail/order-detail.component";
import { OrdersAdminComponent } from "./components/admin/orders-page/orders-admin/orders-admin.component";
import { ReviewsAdminComponent } from "./components/admin/reviews-page/reviews-admin/reviews-admin.component";
import { WishlistComponent } from "./components/main/wishlist/wishlist.component";
import { AboutAdminComponent } from "./components/admin/about-admin/about-admin.component";
import { AboutAdminFormComponent } from "./components/admin/about-admin-form/about-admin-form.component";
import { ContactAdminFormComponent } from "./components/admin/contact-admin-form/contact-admin-form.component";
import { CouponsAdminComponent } from "./components/admin/coupons-admin/coupons-admin.component";
import { CouponFormComponent } from "./components/admin/coupons-form/coupons-form.component";
import { UnsubscribeComponent } from "./pages/unsubscribe/unsubscribe.component";
import {
  NotificationSettingsComponent
} from "./components/profile/notification-settings/notification-settings.component";

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
        loadComponent: () => import('./components/main/products/products.component')
          .then(m => m.ProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./components/main/categories/categories.component')
          .then(m => m.CategoriesComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./components/main/cart/cart.component')
          .then(m => m.CartComponent)
      },
      {
        path: 'product/:slug',
        loadComponent: () => import('./components/main/product-details/product-details.component')
          .then(m => m.ProductDetailsComponent)
      },
      {
        path: 'sale',
        loadComponent: () => import('./components/main/sale/sale.component')
          .then(m => m.SaleComponent)
      },
      {
        path: 'about',
        loadComponent: () => import('./components/main/about/about.component')
          .then(m => m.AboutComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./components/main/contact/contact.component')
          .then(m => m.ContactComponent)
      }
    ]
  },
  {
    path: 'register',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./components/auth/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./components/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./components/auth/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/auth/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent)
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
  {
    path: 'admin/orders',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR] },
    children: [
      { path: '', component: OrdersAdminComponent }
    ]
  },
  {
    path: 'admin/reviews',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR] },
    children: [
      { path: '', component: ReviewsAdminComponent }
    ]
  },
  {
    path: 'admin/coupons',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR] },
    children: [
      { path: '', component: CouponsAdminComponent },
      { path: 'create', component: CouponFormComponent },
      { path: ':couponId/edit', component: CouponFormComponent }
    ]
  },
  {
    path: 'admin/newsletter',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR] },
    children: [
      {
        path: '',
        loadComponent: () => import('./components/admin/newsletter/newsletter-admin/newsletter-admin.component')
          .then(m => m.NewsletterAdminComponent)
      }
    ]
  },
  {
    path: 'profile',
    component: ProfileLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: ProfileEditComponent
      },
      {
        path: 'image',
        component: ProfileImageComponent
      },
      {
        path: 'change-password',
        component: ChangePasswordComponent
      },
      {
        path: 'notifications',
        component: NotificationSettingsComponent
      },
      {
        path: 'addresses',
        children: [
          {
            path: '',
            component: AddressListComponent
          },
          {
            path: 'new',
            component: AddressFormComponent
          },
          {
            path: 'edit/:id',
            component: AddressFormComponent
          }
        ]
      },
      {
        path: 'orders',
        children: [
          {
            path: '',
            component: OrderListComponent
          },
          {
            path: ':id',
            component: OrderDetailComponent
          }
        ]
      }
    ]
  },
  {
    path: 'checkout',
    loadComponent: () => import('./components/main/checkout/checkout.component')
      .then(m => m.CheckoutComponent)
  },
  {
    path: 'checkout/confirmation',
    redirectTo: '/checkout',
  },
  {
    path: 'wishlist',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: WishlistComponent
      }
    ]
  },
  {
    path: 'admin/pages',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR] },
    children: [
      {
        path: 'about',
        component: AboutAdminComponent
      },
      {
        path: 'about/create',
        component: AboutAdminFormComponent
      },
      {
        path: 'about/:id/edit',
        component: AboutAdminFormComponent
      },
      {
        path: 'contact',
        component: ContactAdminFormComponent
      }
    ]
  },
  {
    path: 'newsletter/unsubscribe/:token',
    component: UnsubscribeComponent
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
