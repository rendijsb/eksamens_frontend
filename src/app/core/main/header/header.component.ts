import {Component, HostListener, inject, Input, input, InputSignal, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {Category} from "../../../components/admin/categories-page/models/categories.models";
import {PublicService} from "../../../components/main/service/public.service";
import {ToastrService} from "ngx-toastr";
import {Product} from "../../../components/admin/products-page/models/products.models";
import {catchError, EMPTY, tap} from "rxjs";

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

  protected readonly products = signal<Product[] | null>(null);
  protected readonly categories = signal<Category[] | null>(null);

  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  isSearchOpen = signal(false);
  isUserMenuOpen = signal(false);
  cartItemCount = signal(0);
  searchQuery = signal('');
  isLoggedIn = signal(false);

  ngOnInit(): void {
    this.fetchAllCategories();
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
    console.log('Search submitted:', this.searchQuery());
    this.isSearchOpen.set(false);
  }

  logout(): void {
    this.isLoggedIn.set(false);
    this.isUserMenuOpen.set(false);
  }
}
