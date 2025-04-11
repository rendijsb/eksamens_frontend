import {Component, effect, HostListener, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import {Category} from "../../../components/admin/categories-page/models/categories.models";
import {PublicService} from "../../../components/main/service/public.service";
import {ToastrService} from "ngx-toastr";
import {catchError, EMPTY, tap} from "rxjs";
import {AuthService} from "../../../components/auth/services/auth.service";
import {RoleEnum} from "../../../components/auth/models/user.models";
import {CartService} from "../../../components/main/service/cart.service";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private readonly publicService = inject(PublicService);
  private readonly toastr = inject(ToastrService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);

  protected readonly categories = signal<Category[]>([]);

  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  isSearchOpen = signal(false);
  isUserMenuOpen = signal(false);
  cartItemCount = signal(0);
  searchQuery = signal('');
  isAuthenticated = signal(false);
  currentUser = signal<any>(null);

  constructor() {
    effect(() => {
      this.isAuthenticated.set(!!this.authService.user());
      this.currentUser.set(this.authService.user());
    });
  }

  ngOnInit(): void {
    this.fetchAllCategories();
    this.checkAuthStatus();

    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItemCount.set(response.data?.total_items || 0);
      },
    });

    this.cartService.cartItemCount$.subscribe(count => {
      this.cartItemCount.set(count);
    });
  }

  fetchAllCategories(): void {
    this.publicService.getAllCategories()
      .pipe(
        tap((response) => {
          this.categories.set(response.data);
        }),
        catchError(() => {
          this.toastr.error('Neizdevās atrast kategorijas')
          return EMPTY;
        })
      )
      .subscribe();
  }

  checkAuthStatus(): void {
    this.isAuthenticated.set(this.authService.isAuthenticated());
    if (this.isAuthenticated()) {
      this.currentUser.set(this.authService.user());
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);

    if (this.isMobileMenuOpen()) {
      this.isUserMenuOpen.set(false);
      this.isSearchOpen.set(false);
    }
  }

  toggleSearch(): void {
    this.isSearchOpen.update(value => !value);

    if (this.isSearchOpen()) {
      this.isUserMenuOpen.set(false);
      this.isMobileMenuOpen.set(false);
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(value => !value);

    if (this.isUserMenuOpen()) {
      this.isSearchOpen.set(false);
      this.isMobileMenuOpen.set(false);
    }
  }

  updateSearchQuery(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  submitSearch(): void {
    if (!this.searchQuery()) {
      return;
    }

    this.router.navigate(['/search'], {
      queryParams: { q: this.searchQuery() }
    });

    this.isSearchOpen.set(false);
  }

  logout(): void {
    this.authService.logout()
      .pipe(
        tap(() => {
          this.isUserMenuOpen.set(false);
          this.isAuthenticated.set(false);
          this.currentUser.set(null);
          this.toastr.success('Jūs esat veiksmīgi izrakstījies');
        }),
        catchError(() => {
          this.toastr.error('Neizdevās izrakstīties');
          return EMPTY;
        })
      )
      .subscribe();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === RoleEnum.ADMIN;
  }

  isModerator(): boolean {
    return this.currentUser()?.role === RoleEnum.MODERATOR;
  }
}
