import { Component, OnInit, inject, signal, WritableSignal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap, Subscription } from 'rxjs';
import { PublicService } from "../service/public.service";
import { Category } from "../../admin/categories-page/models/categories.models";
import { SEOService } from "../../../shared/services/seo.service";

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private readonly publicService = inject(PublicService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly seoService = inject(SEOService);
  private subscriptions: Subscription[] = [];

  protected readonly categories: WritableSignal<Category[]> = signal([]);
  protected readonly isLoading: WritableSignal<boolean> = signal(true);
  protected readonly hasError: WritableSignal<boolean> = signal(false);
  protected readonly totalCategories: WritableSignal<number> = signal(0);
  protected readonly activeCategories: WritableSignal<Category[]> = signal([]);

  ngOnInit(): void {
    this.updateCategoriesPageSEO();
    this.fetchAllCategories();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateCategoriesPageSEO(): void {
    this.seoService.updateSEO({
      title: 'Product Categories - NetNest | Shop by Category',
      description: 'Browse all product categories at NetNest. Find products organized by category for easy shopping. Quality products across all categories.',
      keywords: 'categories, product categories, browse categories, shop by category, NetNest, online shopping',
      type: 'website',
      url: 'https://yourdomain.com/categories'
    });

    this.addCategoriesStructuredData([]);
  }

  fetchAllCategories(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const subscription = this.publicService.getAllCategories()
      .pipe(
        tap((response) => {
          if (response && response.data) {
            const categories = response.data;
            this.categories.set(categories);
            this.totalCategories.set(categories.length);
            this.activeCategories.set(categories);
            this.updateCategoriesPageSEOWithData(categories);
            this.addCategoriesStructuredData(categories);
          } else {
            this.categories.set([]);
            this.totalCategories.set(0);
            this.activeCategories.set([]);
          }
        }),
        catchError(() => {
          this.hasError.set(true);
          this.categories.set([]);
          this.totalCategories.set(0);
          this.activeCategories.set([]);
          this.toastr.error('Neizdevās ielādēt kategorijas');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();

    this.subscriptions.push(subscription);
  }

  private updateCategoriesPageSEOWithData(categories: Category[]): void {
    const categoryNames = categories.slice(0, 5).map(cat => cat.name).join(', ');
    const description = categories.length > 0
      ? `Browse ${categories.length} product categories at NetNest including ${categoryNames}. Find quality products organized by category for easy shopping.`
      : 'Browse all product categories at NetNest. Find products organized by category for easy shopping.';

    this.seoService.updateSEO({
      title: `${categories.length} Product Categories - NetNest | Shop by Category`,
      description: description,
      keywords: `categories, product categories, ${categoryNames}, browse categories, shop by category, NetNest, online shopping`,
      type: 'website',
      url: 'https://yourdomain.com/categories'
    });
  }

  private addCategoriesStructuredData(categories: Category[]): void {
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "CollectionPage",
      "name": "Product Categories",
      "description": "Browse all product categories at NetNest",
      "url": "https://yourdomain.com/categories",
      "mainEntity": {
        "@type": "ItemList",
        "name": "Product Categories",
        "description": "All available product categories",
        "numberOfItems": categories.length,
        "itemListElement": categories.map((category, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Thing",
            "name": category.name,
            "description": category.description || `Shop ${category.name} products at NetNest`,
            "url": `https://yourdomain.com/products?category=${category.id}`,
            "image": category.image || '/assets/images/default-category.jpg'
          }
        }))
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://yourdomain.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Categories",
            "item": "https://yourdomain.com/categories"
          }
        ]
      }
    };

    this.insertStructuredData(structuredData);
  }

  private insertStructuredData(data: any): void {
    if (typeof document === 'undefined') return;

    const existingScript = document.getElementById('categories-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'categories-structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  navigateToProducts(categoryId?: number): void {
    if (categoryId) {
      this.router.navigate(['/products'], {
        queryParams: { category: categoryId }
      });
    } else {
      this.router.navigate(['/products']);
    }
  }

  retryLoading(): void {
    this.fetchAllCategories();
  }

  // Utility methods for template usage
  getCategoryImage(category: Category): string {
    return category.image || '/assets/images/default-category.jpg';
  }

  getCategoryDescription(category: Category): string {
    return category.description || `Shop ${category.name} products at NetNest. Quality items at great prices.`;
  }

  // Method to check if category has products (if this data is available)
  hasProducts(category: Category): boolean {
    // Assuming you have a products_count field from your API
    return (category as any).products_count > 0;
  }

  // Method to get product count for display
  getProductCount(category: Category): number {
    return (category as any).products_count || 0;
  }

  // Method to format product count for display
  getProductCountText(category: Category): string {
    const count = this.getProductCount(category);
    if (count === 0) return 'Nav produktu';
    if (count === 1) return '1 produkts';
    return `${count} produkti`;
  }

  trackByCategory(index: number, category: Category): number {
    return category.id;
  }

  // Method to check if we should show empty state
  shouldShowEmptyState(): boolean {
    return !this.isLoading() && !this.hasError() && this.categories().length === 0;
  }

  // Method to check if we should show categories grid
  shouldShowCategories(): boolean {
    return !this.isLoading() && !this.hasError() && this.categories().length > 0;
  }

  // Method to get categories for display (you might want to sort them)
  getDisplayCategories(): Category[] {
    return this.categories().sort((a, b) => {
      // Sort by name alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  // Method to get featured categories (first 6 or marked as featured)
  getFeaturedCategories(): Category[] {
    const categories = this.getDisplayCategories();
    // If you have a featured field, use it, otherwise take first 6
    return (categories as any[]).filter(cat => cat.is_featured) || categories.slice(0, 6);
  }

  // Method to navigate to a specific category with SEO-friendly URL
  navigateToCategoryProducts(category: Category, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    this.router.navigate(['/products'], {
      queryParams: {
        category: category.id,
        categoryName: category.name
      }
    });
  }

  refreshCategories(): void {
    this.fetchAllCategories();
  }
}
